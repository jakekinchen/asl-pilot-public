#!/usr/bin/env bash
# Run the ASL Pilot Codex executor, then immediately run the Codex observer.

set -euo pipefail

REPO_ROOT="${ASL_PILOT_REPO_ROOT:-/Users/kelly/Developer/asl-pilot}"
CODEX_BIN="${CODEX_BIN:-codex}"
CODEX_PROFILE="${CODEX_PROFILE:-${CODEX_PROFILE_V2:-asl-pilot-local-skills}}"
MODE="once"
DRY_RUN=0
ALLOW_DIRTY=0
SLEEP_SECONDS="${PAIR_SLEEP_SECONDS:-30}"
LOCK_DIR="${ASL_PILOT_CODEX_PAIR_LOCK:-/tmp/asl-pilot-codex-pair.lock}"
EXECUTOR_RESUME="${ASL_PILOT_EXECUTOR_RESUME:-1}"
OBSERVER_RESUME="${ASL_PILOT_OBSERVER_RESUME:-1}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/run_codex_pair_cycle.sh --once
  bash scripts/run_codex_pair_cycle.sh --loop
  bash scripts/run_codex_pair_cycle.sh --once --dry-run

Options:
  --once          Run one executor->observer cycle (default).
  --loop          Repeat executor->observer cycles.
  --sleep SECS    Delay between cycles in --loop mode (default: PAIR_SLEEP_SECONDS or 30).
  --allow-dirty   Allow start with a dirty worktree. Use only for recovery.
  --dry-run       Print the commands/prompts instead of invoking Codex.
  --help          Show this message.

Environment:
  ASL_PILOT_REPO_ROOT          Repo root override.
  CODEX_BIN                    Codex executable override.
  CODEX_PROFILE                Codex config profile overlay (default asl-pilot-local-skills).
  CODEX_PROFILE_V2             Back-compat alias when CODEX_PROFILE is unset.
  PAIR_SLEEP_SECONDS           Delay between loop cycles.
  ASL_PILOT_CODEX_PAIR_LOCK    Lock directory path.
  ASL_PILOT_EXECUTOR_RESUME    Set to 0 to start fresh executor sessions (default 1).
  ASL_PILOT_OBSERVER_RESUME    Set to 0 to start fresh observer sessions (default 1).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --once)
      MODE="once"
      shift
      ;;
    --loop)
      MODE="loop"
      shift
      ;;
    --sleep)
      SLEEP_SECONDS="${2:-}"
      shift 2
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
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
      echo "run_codex_pair_cycle: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ ! -d "$REPO_ROOT" ]; then
  echo "run_codex_pair_cycle: repo root not found: $REPO_ROOT" >&2
  exit 1
fi

cd "$REPO_ROOT"

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "run_codex_pair_cycle: Codex CLI not found: $CODEX_BIN" >&2
  exit 1
fi

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "run_codex_pair_cycle: another supervisor appears to be active: $LOCK_DIR" >&2
  echo "Remove the lock only after verifying no run_codex_pair_cycle.sh process is alive." >&2
  exit 3
fi

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

executor_prompt() {
  cat <<'EOF'
You are the ASL Pilot Codex executor. Read GOAL.md, then the active per-milestone prompt it names. Follow docs/runbooks/codex-goal-loop.md and docs/runbooks/observer-runbook-codex.md role boundaries. Complete exactly one smallest useful reviewable slice, validate it, write a numbered session log, commit only scoped files, then stop. Do not push. Do not spend Brev money, import unapproved media, change final gates, or take observer-only redirect decisions without explicit user approval.

Freshness guard: begin every executor turn from the current filesystem state. Treat `git log -1 --oneline`, `git status --short`, current `GOAL.md`, and the active prompt named by `GOAL.md` as newer than any prior assistant message, `/tmp/*-last-message.md`, old session memory, or old observer handoff. If those surfaces point at a newer mission than your remembered context, discard the remembered context and execute only the current mission.

If GOAL.md and the active per-milestone prompt explicitly record current human approval for Brev spend, that approval satisfies the Brev-spend guardrail for the bounded compute envelope in those files. In that case, follow the recorded max-runtime/max-spend/kill-condition/teardown rules, and do not stop the worker merely because it is RUNNING while approved work remains queued.
EOF
}

observer_prompt() {
  cat <<'EOF'
You are the ASL Pilot Codex observer. The Codex executor turn just ended, or the executor was skipped because GOAL.md is stopped. Follow docs/runbooks/observer-runbook-codex.md procedurally, then act on exactly one CONTINUE / NUDGE / REDIRECT / STOP / ESCALATE decision per docs/observer-prompt.md. Inspect the latest commits, numbered session logs, GOAL.md, the active prompt, git status, /tmp/asl-pilot-codex-executor-*.log, .codex-executor-session-id, and the executor Codex session metadata. Observe and steer; do not write implementation code, do not push, and do not take over executor work.

Freshness guard: begin every observer pass from the current filesystem state. Treat `git log -1 --oneline`, `git status --short`, current `GOAL.md`, and the active prompt as newer than any prior assistant message, `/tmp/*-last-message.md`, or old observer log. If a newer executor commit appears while you are deciding, restart the decision against that newest commit. Never restore an old `<stop-orchestrator/>` from memory or an older STOP commit; add a stop sentinel only when the current HEAD/current prompt requires STOP. If you edit GOAL.md or any durable prompt/log, finish with a clean committed tree or restore your own uncommitted edit before ending.
EOF
}

record_session_id() {
  local session_file="$1"
  local contains="$2"
  node scripts/record_latest_codex_session_id.mjs \
    --originator codex_exec,"Codex Desktop" \
    --source exec \
    --session-file "$session_file" \
    --contains "$contains" >/dev/null 2>&1 || true
}

run_codex_turn() {
  local role="$1"
  local session_file="$2"
  local contains="$3"
  local prompt="$4"
  local session_id=""
  local now=""
  local log=""
  local out=""
  local status=0

  if [ -f "$session_file" ]; then
    session_id="$(tr -d "[:space:]" < "$session_file" 2>/dev/null || true)"
  fi
  if [ "$role" = "executor" ] && [ "$EXECUTOR_RESUME" != "1" ]; then
    session_id=""
  fi
  if [ "$role" = "observer" ] && [ "$OBSERVER_RESUME" != "1" ]; then
    session_id=""
  fi

  now="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  log="/tmp/asl-pilot-codex-${role}-${now}.log"
  out="/tmp/asl-pilot-codex-${role}-last-message.md"

  echo "=== ASL Pilot Codex ${role} turn: ${now} ==="
  echo "session-file=${session_file}"
  echo "session-id=${session_id:-new}"
  echo "log=${log}"

  if [ "$DRY_RUN" = "1" ]; then
    if [ -n "$session_id" ]; then
      printf '%q ' "$CODEX_BIN" --profile "$CODEX_PROFILE" exec resume --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --skip-git-repo-check -o "$out" "$session_id" "$prompt"
      printf '\n'
    else
      printf '%q ' "$CODEX_BIN" --profile "$CODEX_PROFILE" exec --dangerously-bypass-approvals-and-sandbox -c 'model_reasoning_effort="xhigh"' --cd "$REPO_ROOT" --skip-git-repo-check -o "$out" "$prompt"
      printf '\n'
    fi
    return 0
  fi

  set +e
  if [ -n "$session_id" ]; then
    "$CODEX_BIN" --profile "$CODEX_PROFILE" exec resume \
      --dangerously-bypass-approvals-and-sandbox \
      -c 'model_reasoning_effort="xhigh"' \
      --skip-git-repo-check \
      -o "$out" \
      "$session_id" \
      "$prompt" 2>&1 | tee "$log"
    status="${PIPESTATUS[0]}"
    if [ "$status" -ne 0 ]; then
      echo "${role} resume failed with status ${status}; starting fresh." | tee -a "$log"
      "$CODEX_BIN" --profile "$CODEX_PROFILE" exec \
        --dangerously-bypass-approvals-and-sandbox \
        -c 'model_reasoning_effort="xhigh"' \
        --cd "$REPO_ROOT" \
        --skip-git-repo-check \
        -o "$out" \
        "$prompt" 2>&1 | tee -a "$log"
      status="${PIPESTATUS[0]}"
    fi
  else
    "$CODEX_BIN" --profile "$CODEX_PROFILE" exec \
      --dangerously-bypass-approvals-and-sandbox \
      -c 'model_reasoning_effort="xhigh"' \
      --cd "$REPO_ROOT" \
      --skip-git-repo-check \
      -o "$out" \
      "$prompt" 2>&1 | tee "$log"
    status="${PIPESTATUS[0]}"
  fi
  set -e

  record_session_id "$session_file" "$contains"
  return "$status"
}

worktree_dirty() {
  [ -n "$(git status --porcelain)" ]
}

run_cycle() {
  local cycle_status=0
  local executor_status=0
  local observer_status=0

  node scripts/audit_codex_pair_state.mjs || true

  if worktree_dirty && [ "$ALLOW_DIRTY" != "1" ]; then
    echo "run_codex_pair_cycle: worktree is dirty before executor turn; refusing to start a new cycle." >&2
    echo "Commit, stash, or rerun with --allow-dirty for deliberate recovery." >&2
    git status --short >&2
    return 4
  fi

  if head -5 GOAL.md | grep -q '^<stop-orchestrator/>$'; then
    echo "GOAL.md stop sentinel present; loop halted -- skipping both executor and observer this cycle (prevents redundant STOP commits)."
    return 0
  fi

  run_codex_turn "executor" ".codex-executor-session-id" "ASL Pilot Codex executor" "$(executor_prompt)" || executor_status="$?"

  run_codex_turn "observer" ".codex-observer-session-id" "ASL Pilot Codex observer" "$(observer_prompt)" || observer_status="$?"

  node scripts/audit_codex_pair_state.mjs || true

  if [ "$executor_status" -ne 0 ]; then
    echo "executor turn exited nonzero: ${executor_status}" >&2
    cycle_status="$executor_status"
  fi
  if [ "$observer_status" -ne 0 ]; then
    echo "observer turn exited nonzero: ${observer_status}" >&2
    cycle_status="$observer_status"
  fi
  return "$cycle_status"
}

case "$MODE" in
  once)
    run_cycle
    ;;
  loop)
    while true; do
      run_cycle || true
      echo "sleeping ${SLEEP_SECONDS}s before next Codex pair cycle"
      sleep "$SLEEP_SECONDS"
    done
    ;;
  *)
    echo "run_codex_pair_cycle: invalid mode: $MODE" >&2
    exit 2
    ;;
esac
