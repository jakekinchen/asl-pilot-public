#!/usr/bin/env bash
#
# brev_sync_repo.sh — rsync the repo to a Brev worker for training.
#
# Anchors: #arch-gpu-execution, #arch-training-pipeline, #arch-storage-policy
# Task:    task-006 (Storage guardrails and Brev helpers)
# Brief:   docs/model/rawframe-trainability-goal-loop-prompt.md
#
# Usage:
#   bash scripts/brev_sync_repo.sh <instance-name> [remote-path]
#
# Required on PATH: brev. The human runs this command.
#
# Excludes everything that should be regenerated on the worker or that is
# intentionally not pushed from the repo sync: data/, node_modules/, .next/,
# artifacts/, .venv/, output/, .git/ (deliberately — Brev worker should not
# need git history). Final rawframe training data is synced separately below as
# a narrow allowlist required by train_rawframe_model.py --check-files and
# the manifest-pinned active-module review evidence.
#
# Source-of-truth excludes match #arch-storage-policy budget assumptions.

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <instance-name> [remote-path]" >&2
  exit 2
fi

INSTANCE_NAME="$1"
REMOTE_PATH_ARG="${2:-}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_TRAINING_DATA="${BREV_SYNC_TRAINING_DATA:-1}"
TRAINING_DATA_PATHS=(
  "data/annotations"
  "data/active-module"
  "data/manifests"
  "data/tensors"
  "data/external/popsign-v1/raw"
  "data/external/asl-citizen/raw"
  "data/external/cira-negative-challenge-videos/raw"
  "data/external/wikimedia-commons-negative-challenge-videos/raw"
)

if ! command -v brev >/dev/null 2>&1; then
  echo "brev_sync_repo: 'brev' CLI not found on PATH. Install from https://brev.dev." >&2
  exit 3
fi

# Resolve the SSH alias Brev exposes for the instance. Brev typically wires
# host entries into ~/.ssh/config; rsync over SSH is the portable path.
SSH_TARGET="${BREV_SSH_TARGET:-${INSTANCE_NAME}}"

# Sanity-check ssh resolvability before rsync — fail loudly, not silently.
if ! ssh -G "$SSH_TARGET" >/dev/null 2>&1; then
  echo "brev_sync_repo: cannot resolve ssh target '$SSH_TARGET'. Run 'brev shell $INSTANCE_NAME' once to register the host, or set BREV_SSH_TARGET." >&2
  exit 4
fi

if [ -n "$REMOTE_PATH_ARG" ]; then
  REMOTE_PATH="$REMOTE_PATH_ARG"
else
  REMOTE_HOME="$(ssh "$SSH_TARGET" 'printf %s "$HOME"')"
  REMOTE_PATH="${REMOTE_HOME}/asl-pilot"
fi

echo "brev_sync_repo: syncing $repo_root → ${SSH_TARGET}:${REMOTE_PATH}"

rsync -avz --delete \
  --exclude='.git/' \
  --exclude='data/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='artifacts/' \
  --exclude='.venv/' \
  --exclude='output/' \
  --exclude='.orchestrator-session-id' \
  "$repo_root/" "${SSH_TARGET}:${REMOTE_PATH}/"

if [ "$SYNC_TRAINING_DATA" != "0" ]; then
  echo "brev_sync_repo: syncing rawframe training data allowlist"

  for data_path in "${TRAINING_DATA_PATHS[@]}"; do
    local_data_path="${repo_root}/${data_path}"
    if [ ! -e "$local_data_path" ]; then
      echo "brev_sync_repo: required training data path missing: $local_data_path" >&2
      exit 5
    fi
  done

  for data_path in "${TRAINING_DATA_PATHS[@]}"; do
    local_data_path="${repo_root}/${data_path}"
    remote_parent="$(dirname "${REMOTE_PATH}/${data_path}")"
    remote_parent_quoted="$(printf '%q' "$remote_parent")"
    ssh "$SSH_TARGET" "mkdir -p -- ${remote_parent_quoted}"
    rsync -avz --delete "${local_data_path}/" "${SSH_TARGET}:${REMOTE_PATH}/${data_path}/"
  done
else
  echo "brev_sync_repo: skipping rawframe training data sync because BREV_SYNC_TRAINING_DATA=0"
fi

echo "brev_sync_repo: done."
