#!/usr/bin/env bash
#
# brev_stop_all_training.sh — stop every Brev instance tagged with this
# project's tag. Idempotent. Safe to run when nothing is running.
#
# Anchors: #arch-gpu-execution
# Task:    task-006 (Storage guardrails and Brev helpers)
# Brief:   docs/model/rawframe-trainability-goal-loop-prompt.md
#
# Usage:
#   bash scripts/brev_stop_all_training.sh
#   BREV_PROJECT_TAG=asl-pilot-rawframe bash scripts/brev_stop_all_training.sh
#
# Required on PATH: brev. The human runs this command (or wraps it in a
# nightly cron) so a forgotten worker does not bill overnight.

set -euo pipefail

PROJECT_TAG="${BREV_PROJECT_TAG:-asl-pilot-rawframe}"

if ! command -v brev >/dev/null 2>&1; then
  echo "brev_stop_all_training: 'brev' CLI not found on PATH. Install from https://brev.dev." >&2
  exit 2
fi

# Prefer native tag filtering when the installed Brev CLI supports it. Older or
# newer CLIs may omit --tag; in that case, list all JSON instances and filter by
# the project naming prefix. Do not swallow list failures because that can leave
# paid workers running while reporting "nothing to stop."
ls_help="$(brev ls --help 2>&1 || true)"

if grep -Fq -- "--tag" <<<"$ls_help"; then
  instances_json="$(brev ls --tag "$PROJECT_TAG" --json)"
  name_filter="tag"
else
  instances_json="$(brev ls --json)"
  name_filter="prefix"
fi

if [ -z "$instances_json" ]; then
  echo "brev_stop_all_training: no instances reported by Brev CLI while filtering by ${name_filter} '${PROJECT_TAG}'."
  exit 0
fi

names="$(PROJECT_TAG="$PROJECT_TAG" NAME_FILTER="$name_filter" node -e "
  let raw = '';
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    let data;
    try { data = JSON.parse(raw); } catch (err) {
      console.error('brev_stop_all_training: failed to parse brev ls --json output');
      process.exit(2);
    }
    const projectTag = process.env.PROJECT_TAG || '';
    const nameFilter = process.env.NAME_FILTER || 'tag';
    const list = Array.isArray(data) ? data : (data && data.instances) || [];
    for (const inst of list) {
      const name = inst && (inst.name || inst.instanceName || inst.id);
      if (!name) continue;
      if (nameFilter === 'prefix' && projectTag && !name.startsWith(projectTag)) continue;
      process.stdout.write(name + '\n');
    }
  });
" <<<"$instances_json")"

if [ -z "$names" ]; then
  echo "brev_stop_all_training: no instances matched ${name_filter} '${PROJECT_TAG}'."
  exit 0
fi

echo "brev_stop_all_training: stopping instances matched by ${name_filter} '${PROJECT_TAG}':"
echo "$names" | sed 's/^/  - /'

while IFS= read -r name; do
  [ -z "$name" ] && continue
  echo "brev_stop_all_training: brev stop $name"
  brev stop "$name" || echo "brev_stop_all_training: warning — failed to stop $name (continuing)" >&2
done <<<"$names"

echo "brev_stop_all_training: done."
