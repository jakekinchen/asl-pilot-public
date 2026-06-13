#!/usr/bin/env bash
#
# brev_create_48h.sh — provision a Brev GPU worker for rawframe training.
#
# Anchors: #arch-gpu-execution, #arch-training-pipeline
# Task:    task-006 (Storage guardrails and Brev helpers)
# Brief:   docs/model/rawframe-trainability-goal-loop-prompt.md
#
# Usage:
#   bash scripts/brev_create_48h.sh                     # uses defaults
#   BREV_INSTANCE_NAME=asl-pilot-rawframe-001 \
#     BREV_GPU=A100 \
#     bash scripts/brev_create_48h.sh
#
# Required on PATH: brev (https://brev.dev). The human runs this command;
# the autonomous orchestrator never provisions Brev.
#
# Defaults align with #arch-gpu-execution: a single A100 worker with at least
# 500GB disk. Brev CLI v0.6.326 does not expose auto-stop or tag flags; stop
# this worker manually when training artifacts are copied back.

set -euo pipefail

PROJECT_TAG="${BREV_PROJECT_TAG:-asl-pilot-rawframe}"
INSTANCE_NAME="${BREV_INSTANCE_NAME:-${PROJECT_TAG}-$(date -u +%Y%m%d-%H%M%S)}"
GPU="${BREV_GPU:-A100}"
INSTANCE_COUNT="${BREV_INSTANCE_COUNT:-1}"
DISK_GB="${BREV_DISK_GB:-500}"
AUTO_STOP_HOURS="${BREV_AUTO_STOP_HOURS:-48}"
CREATE_TIMEOUT_SECONDS="${BREV_CREATE_TIMEOUT_SECONDS:-900}"
DETACHED="${BREV_DETACHED:-0}"
DRY_RUN="${BREV_DRY_RUN:-0}"
INSTANCE_TYPES="${BREV_INSTANCE_TYPES:-${BREV_TYPE:-massedcompute_A100_sxm4_80G_DGX,hyperstack_A100_80G,denvr_A100_sxm4_80G,a2-ultragpu-1g:nvidia-a100-80gb:1,a2-highgpu-1g:nvidia-tesla-a100:1}}"

if ! command -v brev >/dev/null 2>&1; then
  echo "brev_create_48h: 'brev' CLI not found on PATH. Install from https://brev.dev." >&2
  exit 2
fi

create_help="$(brev create --help 2>&1 || true)"
required_flags=(
  "--count"
  "--dry-run"
  "--gpu-name"
  "--min-disk"
  "--type"
)
missing_flags=()

for flag in "${required_flags[@]}"; do
  if ! grep -Eq "(^|[[:space:]])${flag}([[:space:],]|$)" <<<"$create_help"; then
    missing_flags+=("$flag")
  fi
done

if [ "${#missing_flags[@]}" -gt 0 ]; then
  echo "brev_create_48h: live Brev CLI does not expose required guardrail flags: ${missing_flags[*]}" >&2
  echo "brev_create_48h: refusing to provision because the current create contract is not available." >&2
  echo "brev_create_48h: inspect current CLI with: brev create --help" >&2
  echo "brev_create_48h: no-spend dry-run probe after login: brev create ${INSTANCE_NAME} --gpu-name ${GPU} --count ${INSTANCE_COUNT} --min-disk ${DISK_GB} --dry-run" >&2
  exit 6
fi

if [ "${INSTANCE_COUNT}" != "1" ]; then
  echo "brev_create_48h: refusing INSTANCE_COUNT=${INSTANCE_COUNT}; this helper is scoped to one training worker." >&2
  exit 7
fi

echo "brev_create_48h: provisioning instance=${INSTANCE_NAME} gpu=${GPU} count=${INSTANCE_COUNT} min_disk=${DISK_GB}GB"
echo "brev_create_48h: requested auto-stop=${AUTO_STOP_HOURS}h tag=${PROJECT_TAG}, but Brev CLI v0.6.326 does not expose those create flags; stop manually."

create_args=(
  "$INSTANCE_NAME"
  --count "$INSTANCE_COUNT"
  --min-disk "$DISK_GB"
  --timeout "$CREATE_TIMEOUT_SECONDS"
)

if [ -n "$INSTANCE_TYPES" ]; then
  create_args+=(--type "$INSTANCE_TYPES")
else
  create_args+=(--gpu-name "$GPU")
fi

if [ "$DETACHED" = "1" ]; then
  create_args+=(--detached)
fi

if [ "$DRY_RUN" = "1" ]; then
  create_args+=(--dry-run)
  echo "brev_create_48h: dry-run only"
fi

brev create "${create_args[@]}"

if [ "$DRY_RUN" = "1" ]; then
  echo "brev_create_48h: dry-run completed. To provision, rerun without BREV_DRY_RUN=1."
else
  echo "brev_create_48h: created ${INSTANCE_NAME}. Next: bash scripts/brev_sync_repo.sh ${INSTANCE_NAME}"
fi
