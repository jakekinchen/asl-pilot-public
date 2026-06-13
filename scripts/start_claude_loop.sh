#!/usr/bin/env bash
# Retired ASL Pilot helper. The active loop is Codex executor + Codex observer.
# This file remains only so old references fail closed instead of launching the
# retired Claude/Happy path.

set -euo pipefail

cat >&2 <<'EOF'
scripts/start_claude_loop.sh is retired for ASL Pilot.

Use the Codex goal-loop starter instead:
  bash scripts/start_codex_goal_loop.sh --role both --dry-run
  bash scripts/start_codex_goal_loop.sh --role both

This guard did not launch Claude, Happy, iTerm2, Brev, or any cleanup routine.
EOF
exit 2

REPO_ROOT="${ASL_PILOT_REPO_ROOT:-/Users/kelly/Developer/asl-pilot}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
STARTUP_SLEEP_SECONDS="${STARTUP_SLEEP_SECONDS:-6}"
REPLACE_EXISTING=1
CLEANUP_WATCHERS=1
CLOSE_IDLE_TABS=1
CLEANUP_ONLY=0
DRY_RUN=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  cat <<'EOF'

Usage:
  bash scripts/start_claude_loop.sh
  bash scripts/start_claude_loop.sh --cleanup-only
  bash scripts/start_claude_loop.sh --no-replace-existing
  bash scripts/start_claude_loop.sh --dry-run

Options:
  --cleanup-only          Retire stale ASL Pilot Claude/Happy/watch processes, then exit.
  --no-replace-existing  Leave existing ASL Pilot Claude/Happy loops running.
  --keep-watchers        Do not clean observer watcher/tail processes.
  --keep-tabs            Do not close idle shell tabs after retiring loops.
  --dry-run              Print what would be terminated/launched.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --cleanup-only)
      CLEANUP_ONLY=1
      shift
      ;;
    --no-replace-existing)
      REPLACE_EXISTING=0
      shift
      ;;
    --keep-watchers)
      CLEANUP_WATCHERS=0
      shift
      ;;
    --keep-tabs)
      CLOSE_IDLE_TABS=0
      shift
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
      echo "start_claude_loop: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ ! -d "$REPO_ROOT" ]; then
  echo "Repo root not found: $REPO_ROOT" >&2
  exit 1
fi

if ! command -v osascript >/dev/null 2>&1; then
  echo "osascript is required to open the iTerm2 Claude loop tab" >&2
  exit 1
fi

process_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | awk '/^n/ { sub(/^n/, ""); print; exit }'
}

repo_tui_agent_rows() {
  ps -axo pid=,ppid=,pgid=,tty=,command= | while read -r pid _ppid pgid tty command; do
    [ -n "${pid:-}" ] || continue
    [ "$tty" != "??" ] || continue
    case "$command" in
      *"/opt/homebrew/bin/happy"*|*"happy-coder"*|*"claude_local_launcher"*|*"/.local/share/claude/versions/"*|*"claude --"*)
        ;;
      *)
        continue
        ;;
    esac
    [ "$(process_cwd "$pid")" = "$REPO_ROOT" ] || continue
    printf '%s %s\n' "$pgid" "$tty"
  done | sort -u
}

repo_tui_agent_pgids() {
  repo_tui_agent_rows | awk '{ print $1 }' | sort -u
}

repo_tui_agent_ttys() {
  repo_tui_agent_rows | awk '{ print $2 }' | sort -u
}

observer_watcher_rows() {
  ps -axo pid=,ppid=,pgid=,tty=,command= | while read -r pid _ppid pgid _tty command; do
    [ -n "${pid:-}" ] || continue
    case "$command" in
      *"scripts/watch_observer.sh"*|*"tail -n 0 -f /tmp/codex-observer-wake-"*)
        ;;
      *)
        continue
        ;;
    esac
    tty="$(ps -o tty= -p "$pid" 2>/dev/null | tr -d '[:space:]')"
    printf '%s %s\n' "$pgid" "$tty"
  done | sort -u
}

observer_watcher_pgids() {
  observer_watcher_rows | awk '{ print $1 }' | sort -u
}

observer_watcher_ttys() {
  observer_watcher_rows | awk '$2 != "" && $2 != "??" { print $2 }' | sort -u
}

terminate_pgid() {
  local pgid="$1"
  local label="$2"

  [ -n "$pgid" ] || return 0
  if [ "$pgid" = "$$" ]; then
    echo "start_claude_loop: refusing to terminate own process group $pgid" >&2
    return
  fi

  if [ "$DRY_RUN" = "1" ]; then
    echo "dry-run: would terminate $label process group $pgid"
    return
  fi

  echo "Terminating stale $label process group $pgid"
  kill -TERM "-$pgid" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    if ! kill -0 "-$pgid" 2>/dev/null; then
      return
    fi
    sleep 0.2
  done
  kill -KILL "-$pgid" 2>/dev/null || true
}

terminate_idle_shell_for_tty() {
  local tty="$1"
  local pid pgid command

  [ -n "$tty" ] || return 0
  ps -axo pid=,ppid=,pgid=,tty=,command= | while read -r pid _ppid pgid ps_tty command; do
    [ "$ps_tty" = "$tty" ] || continue
    case "$command" in
      "-zsh"|zsh|"-bash"|bash)
        ;;
      *)
        continue
        ;;
    esac
    [ "$(process_cwd "$pid")" = "$REPO_ROOT" ] || continue
    terminate_pgid "$pgid" "idle shell tab"
  done
}

cleanup_existing() {
  local pgid
  local tty
  local stale_ttys

  if [ "$REPLACE_EXISTING" = "1" ]; then
    stale_ttys="$(repo_tui_agent_ttys)"
    while read -r pgid; do
      terminate_pgid "$pgid" "Claude/Happy"
    done <<EOF
$(repo_tui_agent_pgids)
EOF
  else
    stale_ttys=""
  fi

  if [ "$CLEANUP_WATCHERS" = "1" ]; then
    stale_ttys="$stale_ttys
$(observer_watcher_ttys)"
    while read -r pgid; do
      terminate_pgid "$pgid" "observer watcher"
    done <<EOF
$(observer_watcher_pgids)
EOF
  fi

  if [ "$CLOSE_IDLE_TABS" = "1" ]; then
    while read -r tty; do
      terminate_idle_shell_for_tty "$tty"
    done <<EOF
$(printf '%s\n' "$stale_ttys" | sed '/^$/d' | sort -u)
EOF
  fi

  return 0
}

cleanup_existing

if [ "$CLEANUP_ONLY" = "1" ]; then
  echo "Cleanup complete for $REPO_ROOT"
  exit 0
fi

export ASL_PILOT_REPO_ROOT="$REPO_ROOT"
export ASL_PILOT_CLAUDE_BIN="$CLAUDE_BIN"
export ASL_PILOT_STARTUP_SLEEP_SECONDS="$STARTUP_SLEEP_SECONDS"

if [ "$DRY_RUN" = "1" ]; then
  echo "dry-run: would open iTerm2 tab in $REPO_ROOT and send /loop /loop-tick"
  exit 0
fi

osascript <<'OSA'
set repoRoot to system attribute "ASL_PILOT_REPO_ROOT"
set claudeBin to system attribute "ASL_PILOT_CLAUDE_BIN"
set startupDelayText to system attribute "ASL_PILOT_STARTUP_SLEEP_SECONDS"
set startupDelay to startupDelayText as integer
set launchCmd to "cd " & quoted form of repoRoot & " && " & claudeBin & " --dangerously-skip-permissions --permission-mode bypassPermissions"

tell application "iTerm2"
  activate
  if (count of windows) = 0 then
    create window with default profile
  end if
  tell current window
    set newTab to (create tab with default profile)
    tell current session of newTab
      write text launchCmd
      delay startupDelay
      write text "/loop /loop-tick"
    end tell
  end tell
end tell
OSA

echo "Started fresh Claude orchestrator loop in iTerm2 for $REPO_ROOT"
