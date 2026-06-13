#!/usr/bin/env bash
# Start ASL Pilot Codex executor/observer loops in iTerm2.

set -euo pipefail

REPO_ROOT="${ASL_PILOT_REPO_ROOT:-/Users/kelly/Developer/asl-pilot}"
CODEX_BIN="${CODEX_BIN:-codex}"
CODEX_PROFILE="${CODEX_PROFILE:-${CODEX_PROFILE_V2:-asl-pilot-local-skills}}"
ROLE="both"
DRY_RUN=0
EXECUTOR_SLEEP_SECONDS="${EXECUTOR_SLEEP_SECONDS:-30}"
OBSERVER_SLEEP_SECONDS="${OBSERVER_SLEEP_SECONDS:-7200}"
OBSERVER_INITIAL_SLEEP_SECONDS="${OBSERVER_INITIAL_SLEEP_SECONDS:-300}"
PAIR_SLEEP_SECONDS="${PAIR_SLEEP_SECONDS:-30}"
ASL_PILOT_EXECUTOR_RESUME="${ASL_PILOT_EXECUTOR_RESUME:-1}"
ASL_PILOT_OBSERVER_RESUME="${ASL_PILOT_OBSERVER_RESUME:-1}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/start_codex_goal_loop.sh --role both
  bash scripts/start_codex_goal_loop.sh --role supervisor
  bash scripts/start_codex_goal_loop.sh --role executor
  bash scripts/start_codex_goal_loop.sh --role observer
  bash scripts/start_codex_goal_loop.sh --role supervisor --dry-run

Environment:
  ASL_PILOT_REPO_ROOT          Repo root override.
  CODEX_BIN                    Codex executable override.
  CODEX_PROFILE                Codex config profile overlay (default asl-pilot-local-skills).
  CODEX_PROFILE_V2             Back-compat alias when CODEX_PROFILE is unset.
  PAIR_SLEEP_SECONDS           Delay between supervised pair cycles (default 30).
  ASL_PILOT_EXECUTOR_RESUME    Set to 0 to start fresh executor sessions (default 1).
  ASL_PILOT_OBSERVER_RESUME    Set to 0 to start fresh observer sessions (default 1).
  EXECUTOR_SLEEP_SECONDS       Delay between executor turns (default 30).
  OBSERVER_SLEEP_SECONDS       Delay between observer passes (default 7200).
  OBSERVER_INITIAL_SLEEP_SECONDS
                                Initial observer delay (default 300).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --role)
      ROLE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "start_codex_goal_loop: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

case "$ROLE" in
  both|supervisor|executor|observer) ;;
  *)
    echo "start_codex_goal_loop: --role must be both, supervisor, executor, or observer" >&2
    exit 2
    ;;
esac

if [ ! -d "$REPO_ROOT" ]; then
  echo "Repo root not found: $REPO_ROOT" >&2
  exit 1
fi

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "Codex CLI not found: $CODEX_BIN" >&2
  exit 1
fi

if [ "$DRY_RUN" = "0" ] && ! command -v osascript >/dev/null 2>&1; then
  echo "osascript is required to open iTerm2 tabs" >&2
  exit 1
fi

quote() {
  printf '%q' "$1"
}

EXECUTOR_SCRIPT="/tmp/asl-pilot-codex-executor-loop.sh"
OBSERVER_SCRIPT="/tmp/asl-pilot-codex-observer-loop.sh"
SUPERVISOR_SCRIPT="/tmp/asl-pilot-codex-pair-loop.sh"

write_supervisor_script() {
  cat > "$SUPERVISOR_SCRIPT" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd $(quote "$REPO_ROOT")
export ASL_PILOT_REPO_ROOT=$(quote "$REPO_ROOT")
export CODEX_BIN=$(quote "$CODEX_BIN")
export CODEX_PROFILE=$(quote "$CODEX_PROFILE")
export PAIR_SLEEP_SECONDS=$(quote "$PAIR_SLEEP_SECONDS")
export ASL_PILOT_EXECUTOR_RESUME=$(quote "$ASL_PILOT_EXECUTOR_RESUME")
export ASL_PILOT_OBSERVER_RESUME=$(quote "$ASL_PILOT_OBSERVER_RESUME")
exec bash scripts/run_codex_pair_cycle.sh --loop
EOF
  chmod +x "$SUPERVISOR_SCRIPT"
}

write_executor_script() {
  cat > "$EXECUTOR_SCRIPT" <<EOF
#!/usr/bin/env bash
set -uo pipefail
cd $(quote "$REPO_ROOT") || exit 1
export ASL_PILOT_REPO_ROOT=$(quote "$REPO_ROOT")
CODEX_BIN=$(quote "$CODEX_BIN")
CODEX_PROFILE=$(quote "$CODEX_PROFILE")
SLEEP_SECONDS=$(quote "$EXECUTOR_SLEEP_SECONDS")

while true; do
  if head -5 GOAL.md | grep -q '^<stop-orchestrator/>$'; then
    echo "GOAL.md stop sentinel present; executor loop exiting."
    exit 0
  fi

  PROMPT='You are the ASL Pilot Codex executor. Read GOAL.md, then the active per-milestone prompt it names. Follow docs/runbooks/codex-goal-loop.md. Complete exactly one smallest useful reviewable slice, validate it, write a session log, commit only scoped files, then stop. Do not push. Do not spend Brev money or change final gates without explicit user approval. If GOAL.md and the active prompt explicitly record current human Brev approval, that approval satisfies this guardrail for the bounded compute envelope in those files; follow the recorded runtime/spend/kill/teardown rules and do not stop the worker merely because it is RUNNING while approved work remains queued.'
  SESSION_ID=""
  if [ -f .codex-executor-session-id ]; then
    SESSION_ID="\$(tr -d "[:space:]" < .codex-executor-session-id 2>/dev/null || true)"
  fi

  NOW="\$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  LOG="/tmp/asl-pilot-codex-executor-\$NOW.log"
  OUT="/tmp/asl-pilot-codex-executor-last-message.md"

  if [ -n "\$SESSION_ID" ]; then
    "\$CODEX_BIN" --profile "\$CODEX_PROFILE" exec resume --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --skip-git-repo-check -o "\$OUT" "\$SESSION_ID" "\$PROMPT" 2>&1 | tee "\$LOG" || {
      echo "executor resume failed; starting fresh" | tee -a "\$LOG"
      "\$CODEX_BIN" --profile "\$CODEX_PROFILE" exec --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --cd $(quote "$REPO_ROOT") --skip-git-repo-check -o "\$OUT" "\$PROMPT" 2>&1 | tee -a "\$LOG" || true
      node scripts/record_latest_codex_session_id.mjs --originator codex_exec --session-file .codex-executor-session-id --contains "ASL Pilot Codex executor" || true
    }
  else
    "\$CODEX_BIN" --profile "\$CODEX_PROFILE" exec --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --cd $(quote "$REPO_ROOT") --skip-git-repo-check -o "\$OUT" "\$PROMPT" 2>&1 | tee "\$LOG" || true
    node scripts/record_latest_codex_session_id.mjs --originator codex_exec --session-file .codex-executor-session-id --contains "ASL Pilot Codex executor" || true
  fi

  sleep "\$SLEEP_SECONDS"
done
EOF
  chmod +x "$EXECUTOR_SCRIPT"
}

write_observer_script() {
  cat > "$OBSERVER_SCRIPT" <<EOF
#!/usr/bin/env bash
set -uo pipefail
cd $(quote "$REPO_ROOT") || exit 1
export ASL_PILOT_REPO_ROOT=$(quote "$REPO_ROOT")
CODEX_BIN=$(quote "$CODEX_BIN")
CODEX_PROFILE=$(quote "$CODEX_PROFILE")
SLEEP_SECONDS=$(quote "$OBSERVER_SLEEP_SECONDS")
INITIAL_SLEEP_SECONDS=$(quote "$OBSERVER_INITIAL_SLEEP_SECONDS")

sleep "\$INITIAL_SLEEP_SECONDS"
while true; do
  if head -5 GOAL.md | grep -q '^<stop-orchestrator/>$'; then
    echo "GOAL.md stop sentinel present; observer loop exiting."
    exit 0
  fi

  PROMPT='You are the ASL Pilot Codex observer. Follow docs/runbooks/observer-runbook-codex.md in /Users/kelly/Developer/asl-pilot, then act on the decision per docs/observer-prompt.md. Observe the Codex executor, not Claude. Do not write implementation code. Do not push.'
  SESSION_ID=""
  if [ -f .codex-observer-session-id ]; then
    SESSION_ID="\$(tr -d "[:space:]" < .codex-observer-session-id 2>/dev/null || true)"
  fi

  NOW="\$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  LOG="/tmp/asl-pilot-codex-observer-\$NOW.log"
  OUT="/tmp/asl-pilot-codex-observer-last-message.md"

  if [ -n "\$SESSION_ID" ]; then
    "\$CODEX_BIN" --profile "\$CODEX_PROFILE" exec resume --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --skip-git-repo-check -o "\$OUT" "\$SESSION_ID" "\$PROMPT" 2>&1 | tee "\$LOG" || {
      echo "observer resume failed; starting fresh" | tee -a "\$LOG"
      "\$CODEX_BIN" --profile "\$CODEX_PROFILE" exec --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --cd $(quote "$REPO_ROOT") --skip-git-repo-check -o "\$OUT" "\$PROMPT" 2>&1 | tee -a "\$LOG" || true
      node scripts/record_latest_codex_session_id.mjs --originator codex_exec --session-file .codex-observer-session-id --contains "ASL Pilot Codex observer" || true
    }
  else
    "\$CODEX_BIN" --profile "\$CODEX_PROFILE" exec --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --cd $(quote "$REPO_ROOT") --skip-git-repo-check -o "\$OUT" "\$PROMPT" 2>&1 | tee "\$LOG" || true
    node scripts/record_latest_codex_session_id.mjs --originator codex_exec --session-file .codex-observer-session-id --contains "ASL Pilot Codex observer" || true
  fi

  sleep "\$SLEEP_SECONDS"
done
EOF
  chmod +x "$OBSERVER_SCRIPT"
}

open_tab() {
  local title="$1"
  local script_path="$2"
  local command="bash $(quote "$script_path")"

  if [ "$DRY_RUN" = "1" ]; then
    echo "dry-run: would open iTerm2 tab: $title"
    echo "$command"
    sed -n '1,220p' "$script_path"
    return 0
  fi

  ASL_PILOT_TAB_TITLE="$title" ASL_PILOT_TAB_COMMAND="$command" osascript <<'OSA'
set tabTitle to system attribute "ASL_PILOT_TAB_TITLE"
set tabCommand to system attribute "ASL_PILOT_TAB_COMMAND"

tell application "iTerm2"
  activate
  if (count of windows) = 0 then
    create window with default profile
  end if
  tell current window
    set newTab to (create tab with default profile)
    tell current session of newTab
      write text "printf '\\033]0;" & tabTitle & "\\007'"
      write text tabCommand
    end tell
  end tell
end tell
OSA
}

write_executor_script
write_observer_script
write_supervisor_script

case "$ROLE" in
  both)
    open_tab "ASL Codex Executor" "$EXECUTOR_SCRIPT"
    open_tab "ASL Codex Observer" "$OBSERVER_SCRIPT"
    ;;
  supervisor)
    open_tab "ASL Codex Pair Supervisor" "$SUPERVISOR_SCRIPT"
    ;;
  executor)
    open_tab "ASL Codex Executor" "$EXECUTOR_SCRIPT"
    ;;
  observer)
    open_tab "ASL Codex Observer" "$OBSERVER_SCRIPT"
    ;;
esac

echo "Codex goal loop start command completed for role=$ROLE"
