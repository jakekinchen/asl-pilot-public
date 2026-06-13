import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const blockers = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function addCheck(id, label, passed, evidence, blocker) {
  checks.push({
    id,
    label,
    status: passed ? "passed" : "failed",
    evidence,
  });
  if (!passed) blockers.push(blocker ?? `${label} failed`);
}

const modelCard = readJson("web/public/model/model-card.json");
addCheck(
  "model_card_not_trained",
  "Current recognition model card is not trained",
  modelCard.status === "not_trained",
  { status: modelCard.status },
  "web/public/model/model-card.json must remain status=not_trained",
);

const activeClaim = readJson("docs/model/active-vocabulary-claim.json");
addCheck(
  "active_claim_empty",
  "Active vocabulary claim exposes no pass/fail labels",
  activeClaim.modelVersion === "rawframe-not-trained"
    && Array.isArray(activeClaim.activeLabels)
    && activeClaim.activeLabels.length === 0,
  {
    modelVersion: activeClaim.modelVersion,
    activeLabels: activeClaim.activeLabels,
  },
  "active-vocabulary-claim must remain rawframe-not-trained with empty activeLabels",
);

const browserBundle = readJson("web/public/model/browser-model-bundle.json");
addCheck(
  "browser_bundle_disabled",
  "Browser model bundle disables recognition, Detector 0 tracking, and box-driven avatar",
  browserBundle.recognition?.enabled === false
    && browserBundle.detector0_tracking?.enabled === false
    && browserBundle.box_driven_avatar?.enabled === false
    && browserBundle.authored_avatar_demos?.enabled === false,
  {
    recognition_enabled: browserBundle.recognition?.enabled,
    detector0_tracking_enabled: browserBundle.detector0_tracking?.enabled,
    box_driven_avatar_enabled: browserBundle.box_driven_avatar?.enabled,
    authored_avatar_demos_enabled: browserBundle.authored_avatar_demos?.enabled,
  },
  "browser-model-bundle must disable all trained/detector/avatar gates",
);

const lessonSource = read("web/src/components/LessonApp.tsx");
addCheck(
  "lesson_copy_inactive",
  "Lesson page includes explicit inactive model and detector copy",
  lessonSource.includes("Model inactive. This lesson is learn-only.")
    && lessonSource.includes("Detector feed unavailable."),
  {},
  "LessonApp must include model and detector inactive copy",
);
addCheck(
  "lesson_sample_fail_closed",
  "Lesson sample persistence remains fail-closed metadata",
  lessonSource.includes("passed: false")
    && lessonSource.includes("confidence: 0")
    && lessonSource.includes("frameCount: samples.frames.length")
    && !lessonSource.includes("browserInferenceEngine"),
  {},
  "LessonApp must not run recognizer inference or save positive outcomes",
);

for (const relativePath of [
  "web/src/components/CameraViewport.tsx",
  "web/src/components/LessonApp.tsx",
  "web/src/components/RobotMannequin3D.tsx",
  "web/src/lib/avatar-motion.ts",
  "web/src/lib/detector0-engine.ts",
  "web/src/lib/use-camera-capture.ts",
]) {
  const source = read(relativePath);
  addCheck(
    `no_passfail_import_${relativePath}`,
    `${relativePath} does not import pass/fail decision authority`,
    !source.includes("pass-fail-decision") && !source.includes("PassFailDecisionOutput"),
    { path: relativePath },
    `${relativePath} must not import pass/fail decision authority`,
  );
}

const summary = {
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
  blockers,
};
console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  console.error("Lesson fail-closed audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exit(1);
}
