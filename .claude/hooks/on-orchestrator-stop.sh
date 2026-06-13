#!/bin/bash
# .claude/hooks/on-orchestrator-stop.sh
#
# Stop hook for the ASL Pilot autonomous loop.
#
# Fires on every Claude turn end (Stop event). In normal conversation, this
# script does nothing — early-exits at the wake-signal check. Only fires the
# Codex observer when:
#   (a) the orchestrator wrote docs/observer-messages/.wake-observer-now
#       (clean loop exit). See .claude/commands/loop-tick.md "required exit
#       ritual" for how the signal is written.
#
# When fired:
#   - macOS notification posted (user feedback)
#   - Codex observer launched non-interactively in the background. The hook
#     resumes the dedicated observer session recorded in
#     .codex-observer-session-id so observer context accumulates across passes.
#     If the session file is absent or stale, it falls back to a fresh
#     `codex exec` and records the newly created session id after completion.
#   - Observer runs with xhigh reasoning effort + dangerously-bypass-approvals
#     (the user's ~/.codex/config.toml already defaults to these, but explicit
#     flags survive any future config drift).
#   - Wake signal deleted so subsequent Stop events don't re-fire.
#
# This script must exit quickly. The Codex invocation is backgrounded with
# nohup + disown so the hook returns immediately.
#
# Hard rules:
#   - Never blocks the orchestrator
#   - Never writes implementation code or commits
#   - Never echoes the OPENAI_API_KEY (the observer's own runbook enforces
#     this for any escalation calls)
#   - Never pushes to remote (observer's own hard rules in observer-prompt.md)
#   - On any error, fails open (warns user but doesn't crash Claude)

set -uo pipefail

REPO_ROOT="/Users/kelly/Developer/asl-pilot"
WAKE_FILE="$REPO_ROOT/docs/observer-messages/.wake-observer-now"
SESSION_FILE="$REPO_ROOT/.codex-observer-session-id"
LOG_DIR="/tmp"
NOTIFY_TITLE="ASL Pilot autonomous loop"

# Early exit if no wake signal — this is the normal-conversation path
if [ ! -f "$WAKE_FILE" ]; then
  exit 0
fi

# Capture the wake reason BEFORE deleting (so we can pass it to Codex)
NOW=$(date -u +%Y-%m-%dT%H-%M-%SZ)
WAKE_CONTENT=$(cat "$WAKE_FILE" 2>/dev/null || echo "(wake signal unreadable)")
LAST_COMMIT=$(git -C "$REPO_ROOT" log -1 --format=%h 2>/dev/null || echo "unknown")

# Delete the wake signal IMMEDIATELY so subsequent Stop events don't re-fire
rm -f "$WAKE_FILE" 2>/dev/null || true

# macOS notification — user-visible feedback that the hook fired
osascript -e "display notification \"Orchestrator exited at $LAST_COMMIT; resuming Codex observer\" with title \"$NOTIFY_TITLE\"" 2>/dev/null || true

# Verify codex CLI is on PATH
if ! command -v codex >/dev/null 2>&1; then
  echo "[orchestrator-stop hook] codex CLI not found on PATH; cannot fire observer" >&2
  osascript -e "display notification \"codex CLI missing — manual /observer-check needed\" with title \"$NOTIFY_TITLE\"" 2>/dev/null || true
  exit 0
fi

# Compose the prompt — Codex follows the runbook, treats this as mission-rollover priority.
# Explicit references at the top level so Codex's skill auto-loader picks up:
#   - observer-prompt-authoring (for refining the durable observer prompt if needed)
#   - openai-api-research (default escalation path)
#   - gpt-pro-research (deep escalation path)
# Plus explicit pointers to the project-local prompt + runbook files.
PROMPT="You are the ASL Pilot autonomous-loop observer (Codex side). The Claude orchestrator just exited the loop and posted a wake signal. Treat this pass as MISSION-ROLLOVER PRIORITY.

Wake signal contents (now consumed; do not re-read .wake-observer-now):
$WAKE_CONTENT

Last orchestrator commit: $LAST_COMMIT

=== Your durable instructions ===

1. **Read your observer prompt first.** The project-specific durable observer prompt for this loop is at:

   /Users/kelly/Developer/asl-pilot/docs/observer-prompt.md

   That file defines your Observation Mission, Source-of-Truth Chain, Acceptance Criteria, Evidence Standard, Observer Checks, full Decision Tree (CONTINUE / NUDGE / REDIRECT / STOP / ESCALATE), Feedback Format, Escalation Guidance, Hard Limits, and Tone. Read it cover-to-cover at the start of every pass. It was authored using your local observer-prompt-authoring skill (~/.codex/skills/observer-prompt-authoring/SKILL.md); if you find the prompt itself needs refinement during this pass, use that skill to refine it.

2. **Follow the runbook procedurally.** For the exact step-by-step shell commands of one observer pass:

   /Users/kelly/Developer/asl-pilot/docs/runbooks/observer-runbook-codex.md

   This pass is wake-signal-triggered, and the hook has already consumed/deleted the wake-signal file after copying its contents above. START AT STEP 1 of the runbook while treating the supplied wake contents as the Step 0 evidence.

3. **Escalation skills available.** For ESCALATE decisions, you have two Codex skills:
   - openai-api-research (default; programmatic, scriptable, faster, cheaper) — ~/.codex/skills/openai-api-research/SKILL.md
   - gpt-pro-research (deep; ChatGPT.com Pro via in-app browser; long-running) — ~/.codex/skills/gpt-pro-research/SKILL.md
   API key at /Users/kelly/.codex/secrets/openai-api.env (never echo, log, or transmit). Save any escalation artifacts under artifacts/research/observer-NNN-*.

=== Mission-rollover guidance for this pass ===

Mission-rollover passes typically resolve to one of:
- STOP (no next milestone queued; set <stop-orchestrator/> in GOAL.md, write docs/session-logs/NNN-observer-stop.md).
- REDIRECT via /goal-update — queue the next mission with a new per-milestone prompt at docs/model/<slug>-goal-loop-prompt.md, update GOAL.md current mission + exit condition, write docs/session-logs/NNN-observer-redirect.md.

Examine GOAL.md exit condition: if all items are satisfied, the mission closed cleanly and you queue the next one. If some are unmet, the loop exited under stress (hard rule block, validation stuck, harness budget); REDIRECT to unblock or STOP for human input.

=== Commit etiquette ===

For any doc/prompt edits you make, commit with the heredoc template (see docs/autonomous-orchestrator-protocol.md), trailer:

   Co-Authored-By: Codex Observer <observer@codex>

Never push to remote. Never write implementation code. Never git rm source files. Never bypass git hooks. One pass per invocation. Hard limits in docs/observer-prompt.md apply unconditionally.

=== Session continuity ===

This Codex session should be resuming the dedicated observer thread recorded in .codex-observer-session-id. Use that context to recognize patterns (recurring stuck-on-same-gate, repeated nudges that need escalation to redirect, etc.). When in doubt, the file system is the canonical source; conversation context is enrichment.

Begin now."

# Compose the codex command. The wrapper shell cd's into the repo before any
# resume attempt; fresh invocations also pass --cd defensively.
#
# We resume the session id recorded in .codex-observer-session-id. Using
# `--last` is not safe here: any interactive Codex session in this repo can
# become "last", and `codex exec resume` does not accept `--cd`, so cwd must be
# set by the wrapper shell itself. If the recorded session is absent/stale, we
# start fresh and record the newest codex_exec session id for the next wake.
#
# Wrap in nohup + disown for true detached background — Claude returns from
# the hook in milliseconds; Codex does its work without blocking.

LOG_FILE="$LOG_DIR/codex-observer-wake-$NOW.log"
OUT_FILE="$LOG_DIR/codex-observer-wake-$NOW.out"
LAST_MSG_FILE="$LOG_DIR/codex-observer-wake-$NOW.last-message.md"

nohup bash -c '
  set -uo pipefail
  PROMPT_VAR="$1"
  REPO="$2"
  SESSION_FILE_ARG="$3"
  LOG="'"$LOG_FILE"'"
  shift 3

  cd "$REPO" || exit 0

  record_latest_session_id() {
    node - "$REPO" "$SESSION_FILE_ARG" <<'"'"'NODE'"'"' >>"$LOG" 2>&1
const fs = require("fs");
const os = require("os");
const path = require("path");

const repo = process.argv[2];
const sessionFile = process.argv[3];
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

walk(root);
candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

for (const file of candidates.slice(0, 50)) {
  let record;
  try {
    record = JSON.parse(fs.readFileSync(file, "utf8").split(/\n/, 1)[0]);
  } catch {
    continue;
  }
  const payload = record.payload || {};
  if (payload.cwd === repo && payload.originator === "codex_exec" && payload.id) {
    fs.writeFileSync(sessionFile, `${payload.id}\n`);
    console.log(`[observer-wake] recorded Codex observer session id ${payload.id}`);
    process.exit(0);
  }
}

console.log("[observer-wake] warning: could not identify newest codex_exec session id for this repo");
NODE
  }

  run_fresh() {
    echo "[observer-wake] starting fresh codex exec and will record its session id" >>"$LOG"
    codex exec \
      --dangerously-bypass-approvals-and-sandbox \
      -c "model_reasoning_effort=\"xhigh\"" \
      --cd "$REPO" \
      --skip-git-repo-check \
      -o "'"$LAST_MSG_FILE"'" \
      "$PROMPT_VAR" </dev/null 2>>"$LOG"
  }

  SESSION_ID=""
  if [ -f "$SESSION_FILE_ARG" ]; then
    SESSION_ID="$(tr -d "[:space:]" < "$SESSION_FILE_ARG" 2>/dev/null || true)"
  fi

  if [ -n "$SESSION_ID" ]; then
    if codex exec resume \
      --dangerously-bypass-approvals-and-sandbox \
      -c "model_reasoning_effort=\"xhigh\"" \
      --skip-git-repo-check \
      -o "'"$LAST_MSG_FILE"'" \
      "$SESSION_ID" \
      "$PROMPT_VAR" </dev/null 2>>"$LOG"; then
      echo "[observer-wake] resumed Codex observer session $SESSION_ID" >>"$LOG"
    else
      echo "[observer-wake] resume of $SESSION_ID failed; starting fresh codex exec" >>"$LOG"
      run_fresh
    fi
  else
    echo "[observer-wake] no .codex-observer-session-id yet" >>"$LOG"
    run_fresh
  fi

  record_latest_session_id
' _ "$PROMPT" "$REPO_ROOT" "$SESSION_FILE" </dev/null >"$OUT_FILE" 2>&1 &

CODEX_PID=$!
disown "$CODEX_PID" 2>/dev/null || true

# Log launch to observer-log.md so the next observer pass sees the trail
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] orchestrator-stop hook → fired Codex observer (pid $CODEX_PID, session-file); log: $LOG_FILE; last-msg: $LAST_MSG_FILE" >> "$REPO_ROOT/docs/observer-messages/observer-log.md"

exit 0
