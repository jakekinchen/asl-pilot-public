# REASON_COPY Audit Goal Loop Prompt

Interim mission 3f. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

Bind the typed `REASON_COPY: Record<PassFailReason, string>` map in [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx) to the same diagnostic-language gate that already enforces `coachingHint`, `hintKind`, and structured `SIGN_HINT_METADATA` dimensions. The map renders the per-reason copy a learner sees after a failed attempt; right now those eight strings bypass the reviewer-authority chain because they live in TypeScript instead of the curated review JSON.

## Acceptance Criteria

All three must be true:

1. [`scripts/audit_hint_pedagogy_review.mjs`](../../scripts/audit_hint_pedagogy_review.mjs) extended with a new check (alongside `validateSignHintMetadata`) that:
   - Reads `web/src/components/PracticeApp.tsx` as a string.
   - Locates the `const REASON_COPY: Record<PassFailReason, string> = { ... };` block.
   - Extracts each `<key>: "<value>"` entry.
   - Verifies all eight expected `PassFailReason` keys are present (no silently missing reasons).
   - Verifies each value is a non-empty string of >= 10 chars.
   - Runs each value through the existing `DIAGNOSTIC_LANGUAGE_PATTERNS` and emits a blocker per match.
   - Surfaces a `practice_reason_copy` summary alongside `structured_hint_metadata` in the JSON output.
2. The extended audit passes against the current values (which were written non-diagnostically in M3c).
3. Full validation chain green: lint, typecheck, build, `audit_hint_pedagogy_review.mjs`, `audit_no_raw_video_upload`, `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_practice_screen_contract`.

## Forbidden Tactics

- No new dependency; no parallel test runner.
- No edits to `web/src/components/PracticeApp.tsx` or `web/src/lib/pass-fail-decision.ts` (the audit must accept the existing copy without code changes).
- No new files outside the audit + a session log + the per-milestone prompt.

## Handoff

When all three are met, redirect GOAL.md `current mission` to interim mission 3g (stale SHA cleanup).
