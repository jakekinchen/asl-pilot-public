#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  args.set(key.slice(2), process.argv[i + 1]);
  i += 1;
}

const repo = process.env.ASL_PILOT_REPO_ROOT || process.cwd();
const originators = (args.get("originator") || "codex_exec")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const source = args.get("source");
const sessionFile = args.get("session-file");
const contains = args.get("contains");

if (!sessionFile) {
  console.error("record_latest_codex_session_id: --session-file is required");
  process.exit(2);
}

const root = path.join(os.homedir(), ".codex", "sessions");
const candidates = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      candidates.push(full);
    }
  }
}

function textFromContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      return item.text || item.input_text || item.output_text || "";
    })
    .join("\n");
}

function userMessagesInclude(file, needle) {
  let body = "";
  try {
    body = fs.readFileSync(file, "utf8");
  } catch {
    return false;
  }
  for (const line of body.split(/\n/)) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    const payload = record.payload || {};
    if (
      record.type === "response_item"
      && payload.type === "message"
      && payload.role === "user"
      && textFromContent(payload.content).includes(needle)
    ) {
      return true;
    }
    if (
      record.type === "event_msg"
      && payload.type === "user_message"
      && typeof payload.message === "string"
      && payload.message.includes(needle)
    ) {
      return true;
    }
  }
  return false;
}

walk(root);
candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

for (const file of candidates.slice(0, 100)) {
  let firstLine = "";
  try {
    firstLine = fs.readFileSync(file, "utf8").split(/\n/, 1)[0];
  } catch {
    continue;
  }

  let record;
  try {
    record = JSON.parse(firstLine);
  } catch {
    continue;
  }

  const payload = record.payload || {};
  if (
    payload.cwd === repo
    && payload.id
    && originators.includes(payload.originator)
    && (!source || payload.source === source)
  ) {
    if (contains && !userMessagesInclude(file, contains)) continue;
    fs.writeFileSync(sessionFile, `${payload.id}\n`);
    console.log(`recorded ${payload.originator} session id ${payload.id} in ${sessionFile}`);
    process.exit(0);
  }
}

console.error(`could not identify latest ${originators.join(",")} session id for ${repo}`);
process.exit(1);
