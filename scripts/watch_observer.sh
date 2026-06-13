#!/usr/bin/env bash
#
# watch_observer.sh — stream the newest Codex-observer wake log, auto-rotate
# when a fresh observer pass starts, without leaving tail(1) children behind.
#
# Anchors: #arch-principles (autonomous-loop ergonomics)
# Mission: interim mission 3d (observer-monitoring ergonomics)
#
# Background: the orchestrator-stop hook (.claude/hooks/on-orchestrator-stop.sh)
# fires `codex exec` whenever the orchestrator writes
# docs/observer-messages/.wake-observer-now. Each pass writes a new file at
# /tmp/codex-observer-wake-<iso>.log . This script polls the newest log,
# strips ANSI color codes, and rotates when a newer log appears so a human
# operator can watch observer output live without manually rotating.
#
# Usage:
#   bash scripts/watch_observer.sh
#   bash scripts/watch_observer.sh --no-strip-ansi   # keep ANSI escapes
#   bash scripts/watch_observer.sh --pattern '/tmp/codex-observer-wake-*.log'
#
# Exit: Ctrl-C to stop. The script polls every 2 seconds for a newer log.

set -uo pipefail

PATTERN="/tmp/codex-observer-wake-*.log"
STRIP_ANSI=1
POLL_SECONDS=2

while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-strip-ansi)
      STRIP_ANSI=0
      shift
      ;;
    --pattern)
      [ "$#" -ge 2 ] || { echo "watch_observer: --pattern needs a value" >&2; exit 2; }
      PATTERN="$2"
      shift 2
      ;;
    --poll-seconds)
      [ "$#" -ge 2 ] || { echo "watch_observer: --poll-seconds needs a value" >&2; exit 2; }
      POLL_SECONDS="$2"
      shift 2
      ;;
    --help|-h)
      sed -n '3,25p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "watch_observer: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

trap 'exit 0' INT TERM

latest_log() {
  # shellcheck disable=SC2086
  ls -t $PATTERN 2>/dev/null | head -1
}

file_size() {
  wc -c < "$1" 2>/dev/null | tr -d '[:space:]'
}

stream_new_bytes() {
  local file="$1"
  local size
  size="$(file_size "$file")"
  case "$size" in
    ''|*[!0-9]*) return ;;
  esac

  # If a log is truncated in place, restart from byte 0.
  if [ "$size" -lt "$offset" ]; then
    offset=0
  fi

  if [ "$size" -gt "$offset" ]; then
    if [ "$STRIP_ANSI" = "1" ]; then
      tail -c +"$((offset + 1))" "$file" 2>/dev/null | sed -u 's/\x1b\[[0-9;]*m//g'
    else
      tail -c +"$((offset + 1))" "$file" 2>/dev/null
    fi
    offset="$size"
  fi
}

current=""
offset=0

while true; do
  candidate="$(latest_log)"
  if [ -z "$candidate" ]; then
    echo "watch_observer: no observer log yet matching $PATTERN; waiting..."
    sleep "$POLL_SECONDS"
    continue
  fi
  if [ "$candidate" != "$current" ]; then
    echo ""
    echo "=== watch_observer: streaming $(basename "$candidate") ==="
    current="$candidate"
    offset="$(file_size "$current")"
    case "$offset" in
      ''|*[!0-9]*) offset=0 ;;
    esac
  fi
  stream_new_bytes "$current"
  sleep "$POLL_SECONDS"
done
