# README Refresh Goal Loop Prompt

Interim mission 3i. Last autonomous-loop slice before the final halt on mission 3's human-collection blocker. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

The root [`README.md`](../../README.md) was last meaningfully updated at `5a2bd3c` (2026-05-22). Since then, mission 1 (Stage A vestige removal) deleted the entire DTW/keypoint academic-benchmark chain that the README's "Current State" and "Verify" sections describe. The README references at least these deleted artifacts:

- `scripts/audit_academic_benchmark_summary.mjs`
- `scripts/audit_primarymath_frontier_23_dtw_summary.mjs`
- `scripts/run_app_validation_surface_smoke.mjs`
- `scripts/audit_academic_delivery_package.mjs`
- `docs/review/academic-school-project-handoff.md`
- `docs/validation/academic-benchmark-summary.json`
- `docs/validation/academic-delivery-package.json`
- `docs/validation/primarymath-frontier-23-dtw-summary.json`
- The "primarymath-high-support-22-keypoint-dtw" claim itself
- 21-label LSTM/template results
- Stage A and MediaPipe references in the active-claim context

For a school-project handoff the README is the first thing a reviewer reads. Refresh it to reflect the post-`c8b47ea` state.

## Acceptance Criteria

All three must be true:

1. `README.md` no longer references the deleted artifacts (see exit-condition #1 in GOAL.md for the literal list of forbidden strings, plus any others discovered during the rewrite).
2. `README.md` reflects current state: rawframe-only no-pretrained lane, model card `not_trained`, 100 source-curated vocabulary items, `SignHintMetadata` for 12 signs, runbooks for first-party collection + vocabulary reviewer-chain + observer monitoring, mission 3 paused on human collection.
3. No regression on the no-pretrained / privacy / hint / vocab / downstream audits.

## Forbidden Tactics

- No code change.
- No new dependency.
- Do not delete the README history — it's tracked.
- Do not invent claims the project doesn't make (no trained-model boast; the model card is still `not_trained`).

## Handoff

When all three are met, write `docs/session-logs/025-mission-3i-readme-refresh.md`, commit, then do the final halt:

1. Set `<stop-orchestrator/>` at the top of `GOAL.md`.
2. Write `docs/session-logs/026-halt.md` naming mission 3's human-collection blocker as the unresolved gate.
3. Commit the halt log.
4. Do NOT write a wake signal or call `ScheduleWakeup` — this is a genuine halt.
