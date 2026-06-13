#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");

const files = {
  goal: "GOAL.md",
  plan: "docs/model/return-to-form-plan.md",
  readme: "README.md",
  tasks: "MVP_TASKS.md",
  datasetPlan: "docs/model/dataset-and-training-plan.md",
  observerPrompt: "docs/observer-prompt.md",
};

const supersededPromptPaths = [
  "docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md",
  "docs/model/codex-brev-training-execution-goal-loop-prompt.md",
  "docs/model/codex-training-quality-recovery-goal-loop-prompt.md",
  "docs/model/rawframe-first-training-goal-loop-prompt.md",
  "docs/model/rawframe-controlled-clip-heldout-manifest-refresh-goal-loop-prompt.md",
  "docs/model/rawframe-controlled-clip-heldout-brev-training-goal-loop-prompt.md",
  "docs/model/rawframe-wlasl-tensor-remediation-relaunch-goal-loop-prompt.md",
  "docs/model/rawframe-controlled-clip-heldout-evaluation-goal-loop-prompt.md",
  "docs/model/rawframe-approved-external-route-scaling-goal-loop-prompt.md",
  "docs/model/rawframe-non-first-party-data-route-goal-loop-prompt.md",
];

function parseArgs(argv) {
  return { json: argv.includes("--json") };
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^${escaped}\\n([\\s\\S]*?)(?=^## |$)`, "m"));
  return match ? match[1].trim() : "";
}

function extractActivePrompt(goalText) {
  const match = goalText.match(/\*\*Active per-milestone prompt:\*\*\s+\[`([^`]+)`\]/);
  return match ? match[1] : null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const blockers = [];
  const checks = [];

  for (const [id, rel] of Object.entries(files)) {
    const ok = exists(rel);
    checks.push({ check: `${id}_exists`, path: rel, passed: ok });
    if (!ok) blockers.push(`${rel} is missing`);
  }

  if (blockers.length === 0) {
    const goal = read(files.goal);
    const plan = read(files.plan);
    const readme = read(files.readme);
    const tasks = read(files.tasks);
    const datasetPlan = read(files.datasetPlan);
    const observerPrompt = read(files.observerPrompt);

    const activePrompt = extractActivePrompt(goal);
    const activePromptOk =
      typeof activePrompt === "string" &&
      activePrompt.startsWith("docs/model/return-to-form-") &&
      activePrompt.endsWith("-goal-loop-prompt.md");
    checks.push({ check: "goal_points_at_return_to_form_prompt", active_prompt: activePrompt, passed: activePromptOk });
    if (!activePromptOk) blockers.push("GOAL.md must point at a docs/model/return-to-form-*-goal-loop-prompt.md prompt");

    const activePromptExists = activePromptOk && exists(activePrompt);
    checks.push({ check: "active_prompt_exists", active_prompt: activePrompt, passed: activePromptExists });
    if (!activePromptExists) blockers.push(`active return-to-form prompt is missing: ${activePrompt ?? "(not found)"}`);

    const activePromptSuperseded = activePrompt ? supersededPromptPaths.includes(activePrompt) : false;
    checks.push({ check: "active_prompt_not_superseded", active_prompt: activePrompt, passed: !activePromptSuperseded });
    if (activePromptSuperseded) blockers.push(`active prompt is superseded: ${activePrompt}`);

    const missionOk = /Mission 3A[A-Z]/i.test(goal) && /return-to-form|small-proof|fixed-crop/i.test(goal);
    checks.push({ check: "goal_names_return_to_form_mission", passed: missionOk });
    if (!missionOk) blockers.push("GOAL.md must name a return-to-form Mission 3A* milestone");

    const planSpineOk = plan.includes("## Original Plan Spine");
    const planOverlayOk = plan.includes("## Mutable Tactical Overlay");
    const planMilestonesOk = plan.includes("## Milestone Ladder");
    const observerRulesOk = plan.includes("## Observer Transition Rules");
    checks.push({ check: "plan_has_original_spine", passed: planSpineOk });
    checks.push({ check: "plan_has_mutable_overlay", passed: planOverlayOk });
    checks.push({ check: "plan_has_milestone_ladder", passed: planMilestonesOk });
    checks.push({ check: "plan_has_observer_transition_rules", passed: observerRulesOk });
    if (!planSpineOk) blockers.push("return-to-form plan must contain ## Original Plan Spine");
    if (!planOverlayOk) blockers.push("return-to-form plan must contain ## Mutable Tactical Overlay");
    if (!planMilestonesOk) blockers.push("return-to-form plan must contain ## Milestone Ladder");
    if (!observerRulesOk) blockers.push("return-to-form plan must contain ## Observer Transition Rules");

    const readmeStale = /Current state \(Mission 3R|awaiting explicit Brev approval|active work is `Mission 3R/i.test(readme);
    checks.push({ check: "readme_no_stale_mission_3r_active_state", passed: !readmeStale });
    if (readmeStale) blockers.push("README.md still frames Mission 3R/Brev approval as the active state");

    const currentState = extractSection(tasks, "## current state");
    const tasksStale = /Mission 3R|95-label training source|Brev approval prerequisite/i.test(currentState);
    checks.push({ check: "mvp_tasks_current_state_not_mission_3r", passed: !tasksStale });
    if (tasksStale) blockers.push("MVP_TASKS.md current state still frames Mission 3R as active");

    const datasetPlanStale = /only `allowed_for_model_training: true` entry is\s+`first-party-browser-consent-capture`/i.test(
      datasetPlan,
    );
    const datasetPlanPointsToReturn = datasetPlan.includes("return-to-form-plan.md");
    checks.push({ check: "dataset_plan_not_first_party_only_stale", passed: !datasetPlanStale });
    checks.push({ check: "dataset_plan_points_to_return_to_form", passed: datasetPlanPointsToReturn });
    if (datasetPlanStale) blockers.push("dataset-and-training-plan.md still claims first-party is the only trainable source");
    if (!datasetPlanPointsToReturn) blockers.push("dataset-and-training-plan.md must point to return-to-form-plan.md");

    const firstSliceMatch = goal.match(/\*\*First reviewable slice[\s\S]*?(?=^## exit condition)/m);
    const firstSlice = firstSliceMatch ? firstSliceMatch[0] : "";
    const broadTrainingActive =
      /\bevaluate the new\b[\s\S]*model_state\.pt/i.test(firstSlice) ||
      /\btrain\b[\s\S]*(75|95)-label/i.test(firstSlice) ||
      /\brefresh\b[\s\S]*(validation-report|prediction-sidecar)/i.test(firstSlice);
    checks.push({ check: "goal_no_broad_training_first_slice", passed: !broadTrainingActive });
    if (broadTrainingActive) blockers.push("GOAL.md still routes the first reviewable slice to broad training/evaluation");

    const observerReferencesPlan =
      observerPrompt.includes("docs/model/return-to-form-plan.md") &&
      observerPrompt.includes("Milestone Ladder") &&
      observerPrompt.includes("Observer Transition Rules");
    checks.push({ check: "observer_prompt_uses_return_to_form_ladder", passed: observerReferencesPlan });
    if (!observerReferencesPlan) {
      blockers.push("docs/observer-prompt.md must tell the observer to follow the return-to-form milestone ladder");
    }

    for (const rel of supersededPromptPaths) {
      if (!exists(rel)) {
        checks.push({ check: "superseded_prompt_exists", path: rel, passed: false });
        blockers.push(`superseded prompt path is missing unexpectedly: ${rel}`);
        continue;
      }
      const text = read(rel);
      const marked = /Status:\s+superseded by/i.test(text) && text.includes("return-to-form-plan.md");
      checks.push({ check: "superseded_prompt_marked", path: rel, passed: marked });
      if (!marked) blockers.push(`${rel} must be marked superseded by the return-to-form plan`);
    }
  }

  const result = {
    schema_version: "asl-pilot-return-to-form-plan-audit/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    checks,
    blockers,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (blockers.length === 0) {
    console.log("Return-to-form plan audit passed.");
  } else {
    console.error("Return-to-form plan audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
  }

  process.exit(blockers.length === 0 ? 0 : 1);
}

main();
