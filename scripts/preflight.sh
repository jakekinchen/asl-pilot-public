#!/usr/bin/env bash
#
# preflight.sh — run the essential no-regression audit chain in one command.
#
# Anchors: #arch-principles (autonomous-loop ergonomics + handoff hygiene)
# Mission: interim mission 3j
#
# Exits zero with a green summary if every check passes; exits non-zero on the
# first failure with a "FAIL: <command>" message. Appends a one-line record to
# docs/validation/preflight-runs.log per invocation.
#
# Usage:
#   bash scripts/preflight.sh            # full chain (lint + typecheck + build + ONNX wiring smoke)
#   bash scripts/preflight.sh --fast     # skip the slow tail (build + ONNX wiring smoke)
#   bash scripts/preflight.sh --help     # print this header

set -uo pipefail

FAST=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --fast)
      FAST=1
      shift
      ;;
    --help|-h)
      sed -n '3,17p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "preflight: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_LOG="$REPO_ROOT/docs/validation/preflight-runs.log"
START_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Each entry is "label::command" so we can print labels in the summary table
# but still execute the raw command. Order is fast-to-slow with fast-fail.
CORE_CHECKS=(
  "audit_no_pretrained_deps::node scripts/audit_no_pretrained_deps.mjs"
  "audit_no_pretrained_artifact_json::node scripts/audit_no_pretrained_artifact_json.mjs"
  "audit_no_raw_video_upload::node scripts/audit_no_raw_video_upload.mjs"
  "audit_vocabulary_review::node scripts/audit_vocabulary_review.mjs"
  "audit_hint_pedagogy_review::node scripts/audit_hint_pedagogy_review.mjs"
  "audit_downstream_vocabulary_provenance::node scripts/audit_downstream_vocabulary_provenance.mjs"
  "audit_source_register::node scripts/audit_source_register.mjs"
  "audit_practice_screen_contract::node scripts/audit_practice_screen_contract.mjs"
  "audit_browser_compatibility::node scripts/audit_browser_compatibility.mjs"
  "storage_budget_check::bash scripts/storage_budget_check.sh"
  "web_lint::npm --prefix web run lint"
  "web_typecheck::npm --prefix web run typecheck"
)
SLOW_CHECKS=(
  "web_build::npm --prefix web run build"
  "run_browser_onnx_wiring_smoke::node scripts/run_browser_onnx_wiring_smoke.mjs --write"
  "audit_browser_onnx_wiring_smoke::node scripts/audit_browser_onnx_wiring_smoke.mjs"
)

CHECKS=("${CORE_CHECKS[@]}")
if [ "$FAST" = "0" ]; then
  CHECKS+=("${SLOW_CHECKS[@]}")
fi

results=()
failed_label=""
failed_cmd=""

cd "$REPO_ROOT"

for entry in "${CHECKS[@]}"; do
  label="${entry%%::*}"
  cmd="${entry##*::}"
  printf '── %-40s ' "$label"
  start=$(date +%s)
  if output="$(bash -c "$cmd" 2>&1)"; then
    elapsed=$(( $(date +%s) - start ))
    printf 'OK (%ds)\n' "$elapsed"
    results+=("$label::OK::${elapsed}s")
  else
    elapsed=$(( $(date +%s) - start ))
    printf 'FAIL (%ds)\n' "$elapsed"
    results+=("$label::FAIL::${elapsed}s")
    failed_label="$label"
    failed_cmd="$cmd"
    echo ""
    echo "FAIL: $cmd"
    echo "--- output (last 30 lines) ---"
    echo "$output" | tail -30
    break
  fi
done

end_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$(dirname "$RUN_LOG")"
if [ -z "$failed_label" ]; then
  echo "${START_ISO} | exit 0 | all-green${FAST:+ (fast)}" >> "$RUN_LOG"
  echo ""
  echo "=== PREFLIGHT GREEN ==="
  echo "Started: $START_ISO"
  echo "Ended:   $end_iso"
  echo "Mode:    $([ "$FAST" = "1" ] && echo "fast (skipped build + ONNX wiring smoke)" || echo "full")"
  echo "Checks:  ${#results[@]} / ${#results[@]} OK"
  exit 0
else
  echo "${START_ISO} | exit 1 | failed: $failed_label" >> "$RUN_LOG"
  echo ""
  echo "=== PREFLIGHT FAILED at: $failed_label ==="
  echo "First failing command: $failed_cmd"
  echo "Started: $START_ISO"
  echo "Ended:   $end_iso"
  exit 1
fi
