# Preflight Helper Goal Loop Prompt

Interim mission 3j. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

Author `scripts/preflight.sh`: a single command that runs the essential no-regression audit chain end-to-end, with a pass/fail summary, suitable as the recommended "is the repo green?" entry point for both human operators and autonomous loops.

## Acceptance Criteria

All three must be true:

1. **`scripts/preflight.sh` exists**, is `chmod +x`, passes `bash -n`, runs the essential audit chain end-to-end. Exits non-zero on first failure with a clear "FAIL: <command>" message; exits zero with a green summary table otherwise. Writes a one-line append to `docs/validation/preflight-runs.log` (gitignored — transient run record) capturing `ISO timestamp | exit code | first failing command (or 'all-green')`.
2. **`README.md` "Verify the lane" section** points at `bash scripts/preflight.sh` as the recommended entry point.
3. **No regression**: `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_no_raw_video_upload`, `audit_hint_pedagogy_review`, `audit_vocabulary_review`, `audit_downstream_vocabulary_provenance` all pass; AND `bash scripts/preflight.sh` itself exits 0.

## What "essential audit chain" means

In order, fast-fail on the first failure:

1. `node scripts/audit_no_pretrained_deps.mjs`
2. `node scripts/audit_no_pretrained_artifact_json.mjs`
3. `node scripts/audit_no_raw_video_upload.mjs`
4. `node scripts/audit_vocabulary_review.mjs`
5. `node scripts/audit_hint_pedagogy_review.mjs`
6. `node scripts/audit_downstream_vocabulary_provenance.mjs`
7. `node scripts/audit_source_register.mjs`
8. `node scripts/audit_practice_screen_contract.mjs`
9. `node scripts/audit_browser_compatibility.mjs`
10. `bash scripts/storage_budget_check.sh`
11. `npm --prefix web run lint`
12. `npm --prefix web run typecheck`

Then (slow but optional via `--fast` flag to skip):

13. `npm --prefix web run build`
14. `node scripts/run_browser_onnx_wiring_smoke.mjs --write`
15. `node scripts/audit_browser_onnx_wiring_smoke.mjs`

`--fast` skips items 13–15. Default runs them all. The three retained smokes that spawn real `next start` (practice-progress, practice-camera-behavior, dataset-collection-runtime) are NOT in the default preflight — they take minutes and require a built artifact in a specific state; operators run them separately.

## Forbidden Tactics

- No new dependency.
- Do not add this as a new audit script (it's a meta-helper that COMPOSES existing audits).
- Do not bypass any audit.
- Do not edit `web/public/model/model-card.json`.

## Handoff

When all three criteria are met, this is genuinely the last sustainable interim mission without human input. Final halt: set `<stop-orchestrator/>`, write a comprehensive close log naming mission 3's human-action blocker, exit. No wake signal, no ScheduleWakeup.
