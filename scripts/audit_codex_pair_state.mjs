#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const strictMode = args.has("--strict");
const root = process.env.ASL_PILOT_REPO_ROOT || process.cwd();
const realRoot = fs.realpathSync(root);
const sessionRoot = path.join(os.homedir(), ".codex", "sessions");

function readText(file) {
  try {
    return fs.readFileSync(path.join(root, file), "utf8").trim();
  } catch {
    return "";
  }
}

function statIso(file) {
  try {
    return fs.statSync(file).mtime.toISOString();
  } catch {
    return null;
  }
}

function runGit(argsForGit) {
  try {
    return childProcess.execFileSync("git", argsForGit, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    return (error.stdout?.toString() || error.stderr?.toString() || "").trim();
  }
}

function runPs() {
  try {
    return childProcess.execFileSync("ps", [
      "-axo",
      "pid=,ppid=,pgid=,tty=,stat=,etime=,command=",
    ], { encoding: "utf8" });
  } catch {
    return "";
  }
}

function processIdFromPsLine(line) {
  const match = line.trim().match(/^(\d+)\s+/);
  return match ? match[1] : null;
}

function processCwd(pid) {
  if (!pid) return null;
  try {
    const output = childProcess.execFileSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const cwd = output
      .split("\n")
      .find((line) => line.startsWith("n"))
      ?.slice(1);
    return cwd ? fs.realpathSync(cwd) : null;
  } catch {
    return null;
  }
}

function isRepoProcessLine(line) {
  const cwd = processCwd(processIdFromPsLine(line));
  return !cwd || cwd === realRoot;
}

function walkSessionFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSessionFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      out.push(full);
    }
  }
  return out;
}

const allSessionFiles = walkSessionFiles(sessionRoot);

function findSessionFile(id) {
  if (!id) return null;
  return allSessionFiles.find((file) => path.basename(file).includes(id)) || null;
}

function parseSession(file) {
  if (!file) return null;
  let lines;
  try {
    lines = fs.readFileSync(file, "utf8").trimEnd().split("\n");
  } catch {
    return null;
  }

  let meta = {};
  try {
    meta = JSON.parse(lines[0])?.payload || {};
  } catch {
    meta = {};
  }

  let lastUser = null;
  let lastAssistant = null;
  let turnCount = 0;

  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (record.type === "turn_context") {
      turnCount += 1;
      continue;
    }
    const payload = record.payload || {};
    if (record.type !== "response_item" || payload.type !== "message") continue;
    const text = (payload.content || [])
      .map((part) => part.text || "")
      .join("\n")
      .replace(/\s+/g, " ")
      .slice(0, 240);
    if (payload.role === "user") lastUser = { timestamp: record.timestamp, text };
    if (payload.role === "assistant") lastAssistant = { timestamp: record.timestamp, text };
  }

  return {
    file,
    mtime: statIso(file),
    line_count: lines.length,
    turn_count: turnCount,
    meta: {
      id: meta.id || null,
      cwd: meta.cwd || null,
      originator: meta.originator || null,
      source: meta.source || null,
      timestamp: meta.timestamp || null,
    },
    last_user: lastUser,
    last_assistant: lastAssistant,
  };
}

function latestLog(role) {
  let entries = [];
  try {
    entries = fs.readdirSync("/tmp")
      .filter((name) => name.startsWith(`asl-pilot-codex-${role}-`) && name.endsWith(".log"))
      .map((name) => {
        const file = path.join("/tmp", name);
        const stat = fs.statSync(file);
        return { file, mtime_ms: stat.mtimeMs, mtime: stat.mtime.toISOString(), size: stat.size };
      })
      .sort((a, b) => b.mtime_ms - a.mtime_ms);
  } catch {
    entries = [];
  }
  return entries[0] || null;
}

function activePrompt() {
  const goal = readText("GOAL.md");
  const match = goal.match(/\*\*Active per-milestone prompt:\*\* \[`([^`]+)`\]/);
  return {
    stop_sentinel: /^<stop-orchestrator\/>$/m.test(goal.split("\n").slice(0, 5).join("\n")),
    active_prompt: match?.[1] || null,
  };
}

function sessionSummary(role, sessionFileName, psText) {
  const id = readText(sessionFileName);
  const file = findSessionFile(id);
  const processLines = id
    ? psText
      .split("\n")
      .filter((line) => line.includes(id))
      .filter((line) => /codex resume|codex exec|run_codex_pair|start_codex_goal_loop/.test(line))
      .map((line) => line.trim())
    : [];
  return {
    role,
    id: id || null,
    marker_file: path.join(root, sessionFileName),
    marker_mtime: statIso(path.join(root, sessionFileName)),
    session: parseSession(file),
    processes: processLines,
    latest_log: latestLog(role),
  };
}

function repoSessions() {
  const sessions = [];
  for (const file of allSessionFiles) {
    let firstLine = "";
    try {
      firstLine = fs.readFileSync(file, "utf8").split(/\n/, 1)[0];
    } catch {
      continue;
    }
    let meta;
    try {
      meta = JSON.parse(firstLine)?.payload || {};
    } catch {
      continue;
    }
    if (meta.cwd !== root) continue;
    const stat = fs.statSync(file);
    sessions.push({
      id: meta.id || null,
      file,
      mtime: stat.mtime.toISOString(),
      mtime_ms: stat.mtimeMs,
      originator: meta.originator || null,
      source: meta.source || null,
    });
  }
  return sessions.sort((a, b) => b.mtime_ms - a.mtime_ms).slice(0, 5);
}

const psText = runPs();
const gitStatus = runGit(["status", "--short"]);
const branch = runGit(["branch", "--show-current"]);
const head = runGit(["log", "--oneline", "-1"]);
const headDate = runGit(["show", "-s", "--format=%cI", "HEAD"]);
const headBody = runGit(["show", "-s", "--format=%B", "HEAD"]);
const promptState = activePrompt();
const executor = sessionSummary("executor", ".codex-executor-session-id", psText);
const observer = sessionSummary("observer", ".codex-observer-session-id", psText);
const supervisorProcesses = psText
  .split("\n")
  .filter((line) => line.includes("run_codex_pair_cycle.sh") || line.includes("asl-pilot-codex-pair"))
  .filter(isRepoProcessLine)
  .map((line) => line.trim());
const repoSessionList = repoSessions();

const warnings = [];
if (!executor.id) warnings.push("missing .codex-executor-session-id");
if (!observer.id) warnings.push("missing .codex-observer-session-id");
if (executor.id && !executor.session) warnings.push(`executor session ${executor.id} not found under ~/.codex/sessions`);
if (observer.id && !observer.session) warnings.push(`observer session ${observer.id} not found under ~/.codex/sessions`);

if (!supervisorProcesses.length && !executor.processes.length) {
  warnings.push("no live supervisor or executor process detected");
}

if (observer.processes.length && gitStatus && /GOAL\.md|docs\/model\//.test(gitStatus)) {
  warnings.push("observer process is live while durable goal/prompt files are dirty; avoid starting another loop until resolved");
}

if (executor.session?.mtime && headDate && Date.parse(executor.session.mtime) < Date.parse(headDate)) {
  warnings.push("recorded executor session is older than HEAD; verify whether the latest commit came from the intended executor thread");
}

if (/Co-Authored-By: Codex Observer/.test(headBody) && !/^observer:/.test(head)) {
  warnings.push("latest non-observer-looking commit is co-authored by Codex Observer");
}

if (promptState.stop_sentinel) warnings.push("GOAL.md stop sentinel is present; executor should stay parked until observer redirects or user removes it");

const report = {
  schema_version: "asl-pilot-codex-pair-state/v1",
  status: warnings.length ? "warning" : "healthy",
  checked_at: new Date().toISOString(),
  repo: root,
  branch,
  head,
  head_date: headDate || null,
  git_status: gitStatus ? gitStatus.split("\n") : [],
  goal: promptState,
  sessions: {
    executor,
    observer,
    latest_repo_sessions: repoSessionList,
  },
  processes: {
    supervisor: supervisorProcesses,
  },
  warnings,
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`ASL Pilot Codex pair state: ${report.status}`);
  console.log(`repo: ${report.repo}`);
  console.log(`branch: ${report.branch || "(unknown)"}`);
  console.log(`head: ${report.head || "(unknown)"}`);
  console.log(`active prompt: ${promptState.active_prompt || "(missing)"}`);
  console.log(`stop sentinel: ${promptState.stop_sentinel ? "yes" : "no"}`);
  console.log("");
  for (const item of [executor, observer]) {
    console.log(`${item.role}: ${item.id || "(missing)"}`);
    console.log(`  marker mtime: ${item.marker_mtime || "(missing)"}`);
    console.log(`  session mtime: ${item.session?.mtime || "(missing)"}`);
    console.log(`  live processes: ${item.processes.length}`);
    console.log(`  latest log: ${item.latest_log?.file || "(none)"}`);
  }
  console.log(`supervisor processes: ${supervisorProcesses.length}`);
  if (gitStatus) {
    console.log("");
    console.log("dirty files:");
    for (const line of gitStatus.split("\n")) console.log(`  ${line}`);
  }
  if (warnings.length) {
    console.log("");
    console.log("warnings:");
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
}

if (strictMode && warnings.length) process.exit(1);
