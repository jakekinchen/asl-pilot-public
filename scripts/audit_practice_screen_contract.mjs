import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const practiceSource = fs.readFileSync(path.join(root, "web", "src", "components", "PracticeApp.tsx"), "utf8");
const cameraViewportSource = fs.readFileSync(path.join(root, "web", "src", "components", "CameraViewport.tsx"), "utf8");
const cameraHookSource = fs.readFileSync(path.join(root, "web", "src", "lib", "use-camera-capture.ts"), "utf8");
const source = [practiceSource, cameraViewportSource, cameraHookSource].join("\n");

const groups = [
  {
    id: "prompt",
    label: "Practice screen shows the ASL prompt and coaching hint",
    snippets: ["selectedItem.prompt", "selectedItem.coachingHint", "Vocabulary", "Prompt"],
  },
  {
    id: "camera_preview",
    label: "Practice screen requests and shows camera preview",
    snippets: ["navigator.mediaDevices.getUserMedia", "<video ref={videoRef}", "Start camera", "camera.status"],
  },
  {
    id: "attempt_state",
    label: "Practice screen shows attempt state",
    snippets: ["type AttemptStatus", "StatusStrip", "Sampling local camera frames.", "Saving your practice history.", "Saved to your practice history."],
  },
  {
    id: "result_hint",
    label: "Practice screen shows result and targeted hint",
    snippets: ["AttemptResult", "result.passed", "Passed", "Try again", "result.hint"],
  },
  {
    id: "retry_next",
    label: "Practice screen supports retry/save and next action",
    snippets: ["submitAttempt", "Save practice", "nextPrompt", "Next prompt", "setAttemptStatus(\"idle\")"],
  },
  {
    id: "saved_progress",
    label: "Practice screen refreshes saved progress after attempts",
    snippets: ["await refreshProgress()", "/api/attempts", "/api/progress"],
  },
];

// The deployed /practice surface (SignPracticeApp) carries the demo contract:
// prompt + reference video, camera preview, attempt state, verdict + targeted
// hint, retry/next, and account-backed saved progress.
const signPracticeSource = fs.readFileSync(
  path.join(root, "web", "src", "components", "SignPracticeApp.tsx"),
  "utf8",
);
const signGroups = [
  {
    id: "sign_prompt_reference",
    label: "/practice shows the prompt word and reference video",
    snippets: ["Sign this word", "targetItem.label", "pr-refvid", "targetItem.clipUrl", "PRACTICE_CATALOG"],
  },
  {
    id: "sign_camera_preview",
    label: "/practice requests and shows the camera preview",
    snippets: ["practice-video", "camera.status", "Enable camera"],
  },
  {
    id: "sign_attempt_state",
    label: "/practice shows attempt state through the capture phases",
    snippets: ["Get ready…", "Sign now", "Reading your sign…", "captureProgress"],
  },
  {
    id: "sign_result_hint",
    label: "/practice shows the verdict and a targeted hint on misses",
    snippets: ["verdict.accepted", "practice-hint", "hintDimensionLabel(verdict.hint.dimension)", "resolvePracticeHint"],
  },
  {
    id: "sign_retry_next",
    label: "/practice supports retry and next actions",
    snippets: ["Try again", "Next word", "newWord", "Skip"],
  },
  {
    id: "sign_saved_progress",
    label: "/practice saves attempts to the learner account and shows saved progress",
    snippets: ["/api/attempts", "/api/progress", "/api/me", "practice-auth-panel", "practice-progress-panel", "practice-save-line", "refreshProgress"],
  },
];

const checks = [
  ...groups.map((group) => {
    const missing = group.snippets.filter((snippet) => !source.includes(snippet));
    return {
      id: group.id,
      label: group.label,
      status: missing.length === 0 ? "passed" : "failed",
      missing,
    };
  }),
  ...signGroups.map((group) => {
    const missing = group.snippets.filter(
      (snippet) => !signPracticeSource.includes(snippet),
    );
    return {
      id: group.id,
      label: group.label,
      status: missing.length === 0 ? "passed" : "failed",
      missing,
    };
  }),
];
const blockers = checks
  .filter((check) => check.status !== "passed")
  .flatMap((check) => check.missing.map((snippet) => `${check.label}: missing ${snippet}`));

console.log(JSON.stringify({
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
  blockers,
}, null, 2));

if (blockers.length > 0) {
  console.error("Practice screen contract audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exitCode = 1;
}
