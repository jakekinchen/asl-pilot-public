#!/usr/bin/env node
//
// audit_claude_context_health.mjs — inspect the latest Claude Code transcript
// for context-window degradation signals before the autonomous loop starts the
// next slice.
//
// Anchors: #arch-principles (autonomous-loop discipline)
//
// Usage:
//   node scripts/audit_claude_context_health.mjs
//   node scripts/audit_claude_context_health.mjs --json
//
// Exit:
//   0  — healthy or warning only
//   1  — rollover_required; start a fresh Claude thread before more work
//   2  — audit error

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const THRESHOLDS = {
  warning_recent_context_tokens: 150_000,
  rollover_recent_context_tokens: 220_000,
  warning_max_context_tokens: 300_000,
  rollover_max_context_tokens: 450_000,
  warning_transcript_bytes: 5 * 1024 * 1024,
  rollover_transcript_bytes: 9 * 1024 * 1024,
  warning_line_count: 2_500,
};

function projectTranscriptDir() {
  const slug = root.replaceAll(path.sep, "-");
  return path.join(os.homedir(), ".claude", "projects", slug);
}

function listTranscriptFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}

function usageTotal(usage) {
  return (
    (Number.isFinite(usage?.input_tokens) ? usage.input_tokens : 0) +
    (Number.isFinite(usage?.cache_read_input_tokens) ? usage.cache_read_input_tokens : 0) +
    (Number.isFinite(usage?.cache_creation_input_tokens) ? usage.cache_creation_input_tokens : 0)
  );
}

function parseTranscript(filePath) {
  const stat = fs.statSync(filePath);
  const lines = fs.readFileSync(filePath, "utf8").split(/\n/).filter(Boolean);
  const usageSamples = [];
  let firstTimestamp = null;
  let lastTimestamp = null;
  let maxUsage = null;
  let awaySummaryCount = 0;
  let stopHookSummaryCount = 0;
  let ranOutOfContextMarker = false;

  lines.forEach((line, index) => {
    if (/ran out of context/i.test(line)) ranOutOfContextMarker = true;

    let record;
    try {
      record = JSON.parse(line);
    } catch {
      return;
    }

    if (typeof record.timestamp === "string") {
      firstTimestamp ??= record.timestamp;
      lastTimestamp = record.timestamp;
    }

    if (record.type === "system" && record.subtype === "away_summary") awaySummaryCount += 1;
    if (record.type === "system" && record.subtype === "stop_hook_summary") stopHookSummaryCount += 1;

    const usage = record.message?.usage;
    if (!usage) return;
    const total = usageTotal(usage);
    const sample = {
      line: index + 1,
      timestamp: record.timestamp ?? null,
      total_context_tokens: total,
      input_tokens: usage.input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
    };
    usageSamples.push(sample);
    if (!maxUsage || total > maxUsage.total_context_tokens) maxUsage = sample;
  });

  return {
    path: filePath,
    session_id: path.basename(filePath, ".jsonl"),
    bytes: stat.size,
    line_count: lines.length,
    first_timestamp: firstTimestamp,
    last_timestamp: lastTimestamp,
    recent_usage: usageSamples.slice(-8),
    recent_usage_sample: usageSamples.at(-1) ?? null,
    max_usage_sample: maxUsage,
    away_summary_count: awaySummaryCount,
    stop_hook_summary_count: stopHookSummaryCount,
    ran_out_of_context_marker: ranOutOfContextMarker,
  };
}

function classify(transcript) {
  const blockers = [];
  const warnings = [];
  const recentTotal = transcript.recent_usage_sample?.total_context_tokens ?? 0;
  const maxTotal = transcript.max_usage_sample?.total_context_tokens ?? 0;

  if (transcript.ran_out_of_context_marker) {
    blockers.push("latest Claude transcript contains a ran-out-of-context continuation marker");
  }
  if (recentTotal >= THRESHOLDS.rollover_recent_context_tokens) {
    blockers.push(
      `recent cached context ${recentTotal} tokens is >= rollover threshold ${THRESHOLDS.rollover_recent_context_tokens}`,
    );
  } else if (recentTotal >= THRESHOLDS.warning_recent_context_tokens) {
    warnings.push(
      `recent cached context ${recentTotal} tokens is >= warning threshold ${THRESHOLDS.warning_recent_context_tokens}`,
    );
  }
  if (maxTotal >= THRESHOLDS.rollover_max_context_tokens) {
    blockers.push(
      `max cached context ${maxTotal} tokens is >= rollover threshold ${THRESHOLDS.rollover_max_context_tokens}`,
    );
  } else if (maxTotal >= THRESHOLDS.warning_max_context_tokens) {
    warnings.push(
      `max cached context ${maxTotal} tokens is >= warning threshold ${THRESHOLDS.warning_max_context_tokens}`,
    );
  }
  if (transcript.bytes >= THRESHOLDS.rollover_transcript_bytes) {
    blockers.push(
      `transcript size ${transcript.bytes} bytes is >= rollover threshold ${THRESHOLDS.rollover_transcript_bytes}`,
    );
  } else if (transcript.bytes >= THRESHOLDS.warning_transcript_bytes) {
    warnings.push(
      `transcript size ${transcript.bytes} bytes is >= warning threshold ${THRESHOLDS.warning_transcript_bytes}`,
    );
  }
  if (transcript.line_count >= THRESHOLDS.warning_line_count) {
    warnings.push(
      `transcript line count ${transcript.line_count} is >= warning threshold ${THRESHOLDS.warning_line_count}`,
    );
  }
  if (transcript.away_summary_count > 0) {
    warnings.push(`transcript contains ${transcript.away_summary_count} away_summary marker(s)`);
  }

  return {
    status: blockers.length > 0 ? "rollover_required" : warnings.length > 0 ? "warning" : "passed",
    blockers,
    warnings,
  };
}

function summary() {
  const transcriptDir = projectTranscriptDir();
  const files = listTranscriptFiles(transcriptDir);
  if (files.length === 0) {
    return {
      schema_version: "asl-pilot-claude-context-health/v1",
      status: "passed",
      checked_at: new Date().toISOString(),
      transcript_dir: transcriptDir,
      latest_transcript: null,
      thresholds: THRESHOLDS,
      blockers: [],
      warnings: ["no Claude Code transcript files found for this repo"],
    };
  }

  const latest = parseTranscript(files[0]);
  const classification = classify(latest);
  return {
    schema_version: "asl-pilot-claude-context-health/v1",
    status: classification.status,
    checked_at: new Date().toISOString(),
    transcript_dir: transcriptDir,
    latest_transcript: latest,
    thresholds: THRESHOLDS,
    blockers: classification.blockers,
    warnings: classification.warnings,
  };
}

function printHuman(result) {
  console.log(`Claude context health: ${result.status}`);
  if (result.latest_transcript) {
    const t = result.latest_transcript;
    console.log(
      `Latest transcript: ${t.path} (${t.bytes} bytes, ${t.line_count} lines, ${t.first_timestamp ?? "?"} -> ${t.last_timestamp ?? "?"})`,
    );
    console.log(
      `Recent context tokens: ${t.recent_usage_sample?.total_context_tokens ?? 0}; max context tokens: ${t.max_usage_sample?.total_context_tokens ?? 0}`,
    );
  }
  if (result.blockers.length > 0) {
    console.log("");
    console.log("Blockers:");
    for (const blocker of result.blockers) console.log(`  - ${blocker}`);
  }
  if (result.warnings.length > 0) {
    console.log("");
    console.log("Warnings:");
    for (const warning of result.warnings) console.log(`  - ${warning}`);
  }
}

function main() {
  const asJson = process.argv.slice(2).includes("--json");
  const result = summary();
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }
  return result.status === "rollover_required" ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    `audit_claude_context_health failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 2;
}
