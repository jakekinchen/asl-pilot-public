#!/usr/bin/env node
//
// audit_loop_premise.mjs — check the autonomous loop's stated premise against
// the actual repo state. Catches the failure mode that produced
// docs/session-logs/041-postmortem-first-party-misread.md: when GOAL.md or
// the active per-milestone prompt frames a blocker that the repo state has
// already cleared, the loop reinforces the wrong premise indefinitely.
//
// Anchors: #arch-principles (autonomous-loop discipline)
//
// Usage:
//   node scripts/audit_loop_premise.mjs            # human-readable summary
//   node scripts/audit_loop_premise.mjs --json     # machine-readable
//
// Exit:
//   0  — no premise contradictions detected
//   1  — at least one contradiction detected (narrative claims X, state shows
//        otherwise); the orchestrator must address before continuing the loop

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const GOAL_PATH = path.join(root, "GOAL.md");
const SOURCE_REGISTER_PATH = path.join(root, "docs/model/dataset-source-register.json");
const MANIFEST_PATHS = [
  "data/manifests/train.json",
  "data/manifests/validation.json",
  "data/manifests/test.json",
  "data/manifests/negative-challenge.json",
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function extractCurrentMission(goalText) {
  const match = goalText.match(/^## current mission\b[^\n]*\n([\s\S]*?)(?=^## )/m);
  return match ? match[1].trim() : "";
}

function blockedOnFirstPartyClause(missionText) {
  // Match the family of phrasings the orchestrator used during the misread.
  const patterns = [
    /\bblocked\s+on\s+human\s+(first[- ]party\s+)?(clip\s+)?collection\b/i,
    /\bpaused\s+(on\s+)?human\s+(first[- ]party\s+)?(clip\s+)?collection\b/i,
    /\bawaiting\s+human\s+first[- ]party\s+collection\b/i,
    /\bhuman[- ]only\s+first[- ]party\b/i,
    /\bfirst[- ]party\s+clip\s+collection\s+(is\s+)?required\b/i,
    /\bmission\s+3\s+(is\s+)?(paused|blocked)\b/i,
  ];
  for (const p of patterns) {
    if (p.test(missionText)) return p.source;
  }
  return null;
}

function approvedTrainingSourceIds(sourceRegister) {
  return sourceRegister.sources
    .filter((s) => s.allowed_for_model_training === true)
    .map((s) => s.source_id);
}

function manifestSourceIds(manifest) {
  const ids = new Set();
  const top = manifest.source_register?.decision_id;
  if (typeof top === "string") ids.add(top);
  const ext = manifest.external_dataset_import?.source_id;
  if (typeof ext === "string") ids.add(ext);
  return [...ids];
}

function rule1_blockedNarrativeVsClearedManifests() {
  const findings = [];
  const evidence = {
    rule: "blocked-narrative-vs-cleared-manifests",
    description:
      "GOAL.md or the active per-milestone prompt claims the loop is blocked on human first-party collection, but data/manifests/*.json already exist AND bind to sources approved for training in docs/model/dataset-source-register.json.",
    triggered: false,
  };
  if (!fs.existsSync(GOAL_PATH)) return { findings, evidence };
  const goalText = fs.readFileSync(GOAL_PATH, "utf8");
  const mission = extractCurrentMission(goalText);
  const matchedPattern = blockedOnFirstPartyClause(mission);
  evidence.narrative_match = matchedPattern;
  if (!matchedPattern) return { findings, evidence };

  if (!fs.existsSync(SOURCE_REGISTER_PATH)) {
    findings.push(
      "audit_loop_premise: GOAL.md frames a first-party blocker but docs/model/dataset-source-register.json is missing — cannot cross-check; investigate.",
    );
    return { findings, evidence };
  }
  const register = readJson(SOURCE_REGISTER_PATH);
  const approvedIds = new Set(approvedTrainingSourceIds(register));
  evidence.approved_training_source_ids = [...approvedIds];

  const existing = [];
  for (const rel of MANIFEST_PATHS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    let manifest;
    try {
      manifest = readJson(abs);
    } catch (err) {
      findings.push(
        `audit_loop_premise: ${rel} exists but is not valid JSON (${err instanceof Error ? err.message : String(err)}); investigate before proceeding.`,
      );
      continue;
    }
    const sourceMode = manifest.dataset_source_mode;
    const sourceIds = manifestSourceIds(manifest);
    const clearedSourceIds = sourceIds.filter((id) =>
      [...approvedIds].some((approved) => id.includes(approved.replace(/_[0-9_]+$/, "")) || approved === id),
    );
    existing.push({
      path: rel,
      sha256: sha256File(abs),
      dataset_source_mode: sourceMode,
      source_register_decision_ids: sourceIds,
      cleared_for_training: clearedSourceIds.length > 0,
      clip_count: Array.isArray(manifest.clips) ? manifest.clips.length : null,
      label_count: Array.isArray(manifest.labels) ? manifest.labels.length : null,
    });
  }
  evidence.manifests_on_disk = existing;
  const cleared = existing.filter((m) => m.cleared_for_training);
  if (cleared.length > 0) {
    findings.push(
      `audit_loop_premise: GOAL.md current mission frames a first-party-collection blocker (matched pattern: ${matchedPattern}), but ${cleared.length} approved-source manifest(s) already exist on disk: ${cleared.map((m) => `${m.path} (${m.clip_count ?? "?"} clips, ${m.label_count ?? "?"} labels)`).join("; ")}. The next concrete action is to address the actual audit_final_manifests blocker (likely a hash/snapshot refresh), not to wait for human collection. See docs/session-logs/041-postmortem-first-party-misread.md.`,
    );
    evidence.triggered = true;
  }
  return { findings, evidence };
}

function rule2_namedArtifactsAlreadyExist() {
  // Generic check: if the current-mission block or the active per-milestone
  // prompt names a path "must exist" / "missing" / "not yet present", and the
  // path actually exists on disk, flag the contradiction.
  const findings = [];
  const evidence = {
    rule: "named-artifacts-already-exist",
    description:
      "GOAL.md or the active per-milestone prompt asserts an artifact is missing, but the file exists on disk.",
    triggered: false,
    checks: [],
  };
  if (!fs.existsSync(GOAL_PATH)) return { findings, evidence };
  const goalText = fs.readFileSync(GOAL_PATH, "utf8");
  const mission = extractCurrentMission(goalText);
  // Naive but effective: find sentences like "X does not exist" / "X missing"
  // referencing a path-like token, and check that file.
  const pathPattern = /([\w./\-]+\.(json|md|mjs|py|ts|tsx|sh))/g;
  const negatePattern = /\b(does not exist|is missing|not yet present|not present yet|never been collected|to be collected)\b/i;
  const lines = mission.split(/\n/);
  for (const line of lines) {
    if (!negatePattern.test(line)) continue;
    const paths = [...line.matchAll(pathPattern)].map((m) => m[1]);
    for (const p of paths) {
      if (p.startsWith("http") || p.includes(" ")) continue;
      const abs = path.join(root, p);
      if (fs.existsSync(abs)) {
        evidence.checks.push({ asserted_missing: p, actually_exists: true });
        findings.push(
          `audit_loop_premise: current-mission narrative implies ${p} is missing, but ${p} exists on disk. Re-read the file before continuing.`,
        );
        evidence.triggered = true;
      }
    }
  }
  return { findings, evidence };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const ruleResults = [
    rule1_blockedNarrativeVsClearedManifests(),
    rule2_namedArtifactsAlreadyExist(),
  ];
  const allFindings = ruleResults.flatMap((r) => r.findings);
  const status = allFindings.length === 0 ? "passed" : "incomplete";
  const summary = {
    schema_version: "asl-pilot-loop-premise-audit/v1",
    status,
    checked_at: new Date().toISOString(),
    rules: ruleResults.map((r) => r.evidence),
    blockers: allFindings,
  };
  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Loop premise audit: ${status}`);
    if (allFindings.length > 0) {
      console.log("");
      console.log("Findings:");
      for (const f of allFindings) console.log(`  - ${f}`);
    } else {
      console.log("No premise contradictions detected.");
    }
  }
  return allFindings.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    `audit_loop_premise failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 2;
}
