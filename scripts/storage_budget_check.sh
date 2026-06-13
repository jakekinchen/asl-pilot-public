#!/usr/bin/env bash
#
# storage_budget_check.sh — fail-closed local storage guardrail.
#
# Anchors: #arch-storage-policy, #arch-gpu-execution
# Task:    task-006 (Storage guardrails and Brev helpers)
# Brief:   docs/model/rawframe-trainability-goal-loop-prompt.md
#
# Reads thresholds from configs/storage-budget.json and exits non-zero when:
#   - free space on the repo volume is below must_keep_free_gb, OR
#   - project on-disk footprint exceeds soft_stop_project_data_gb.
#
# Project footprint is measured as du -sk on the repo root excluding .git/.
# Free space is read from df -Pk on the repo root.
#
# Usage: bash scripts/storage_budget_check.sh
# Exit:  0 = within budget, non-zero = guardrail tripped or input error.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config_path="$repo_root/configs/storage-budget.json"

if [ ! -f "$config_path" ]; then
  echo "storage_budget_check: missing $config_path" >&2
  exit 2
fi

# Parse the two thresholds we care about using node (already a repo dep).
must_keep_free_gb=$(node -e "
  const cfg = require('$config_path');
  if (typeof cfg.must_keep_free_gb !== 'number') { process.exit(3); }
  process.stdout.write(String(cfg.must_keep_free_gb));
")
soft_stop_project_data_gb=$(node -e "
  const cfg = require('$config_path');
  if (typeof cfg.soft_stop_project_data_gb !== 'number') { process.exit(3); }
  process.stdout.write(String(cfg.soft_stop_project_data_gb));
")

# Free space on the volume containing the repo, in KiB then converted to GiB.
free_kib=$(df -Pk "$repo_root" | awk 'NR==2 { print $4 }')
if ! [[ "$free_kib" =~ ^[0-9]+$ ]]; then
  echo "storage_budget_check: could not parse df output for $repo_root" >&2
  exit 4
fi
free_gib=$(( free_kib / 1024 / 1024 ))

# Project on-disk footprint (excluding .git/), in KiB then GiB.
project_kib=$(du -sk -I '.git' "$repo_root" 2>/dev/null | awk '{ print $1 }' || true)
if [ -z "${project_kib:-}" ] || ! [[ "$project_kib" =~ ^[0-9]+$ ]]; then
  # macOS du does not implement -I; fall back to summing children except .git.
  project_kib=$(find "$repo_root" -mindepth 1 -maxdepth 1 ! -name '.git' -exec du -sk {} + \
    | awk '{ sum += $1 } END { print sum + 0 }')
fi
if ! [[ "$project_kib" =~ ^[0-9]+$ ]]; then
  echo "storage_budget_check: could not measure project footprint" >&2
  exit 5
fi
project_gib=$(( project_kib / 1024 / 1024 ))

status=0
echo "storage_budget_check: free=${free_gib} GiB (min ${must_keep_free_gb} GiB), project=${project_gib} GiB (max ${soft_stop_project_data_gb} GiB)"

if [ "$free_gib" -lt "$must_keep_free_gb" ]; then
  echo "storage_budget_check: FAIL — free space ${free_gib} GiB < ${must_keep_free_gb} GiB" >&2
  status=10
fi
if [ "$project_gib" -gt "$soft_stop_project_data_gb" ]; then
  echo "storage_budget_check: FAIL — project footprint ${project_gib} GiB > ${soft_stop_project_data_gb} GiB" >&2
  status=11
fi

exit "$status"
