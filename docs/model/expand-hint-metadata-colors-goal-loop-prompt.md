# Expand SIGN_HINT_METADATA (Colors) Goal Loop Prompt

Interim mission 3k. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

Add structured hint metadata for 5 color signs whose canonical forms are reviewer-safe to author from the existing source-curated `coachingHint` text in [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts):

- `blue` — B handshape (right hand), small shake at neutral signing space.
- `green` — G handshape, small shake at neutral signing space.
- `yellow` — Y handshape, small shake at neutral signing space.
- `red` — index finger brushing down across the lips/chin.
- `black` — index finger drawn across the forehead.

These are documented in beginner ASL curricula and the structured cues mirror the already-reviewer-approved `coachingHint` in vocabulary.ts. No new sign forms are invented.

## Acceptance Criteria

1. [`web/src/lib/sign-hint-metadata.json`](../../web/src/lib/sign-hint-metadata.json) `items` includes the 5 new entries, each with `handshape`, `movement`, `location`, `orientation` dimensions (>= 10 chars, descriptive, no diagnostic language). `timing` and `framing` only when salient to the sign (e.g. brief framing for letter-handshape signs).
2. `node scripts/audit_hint_pedagogy_review.mjs` reports `structured_hint_metadata.populated_entries >= 17`.
3. `bash scripts/preflight.sh` exits 0.

## Forbidden Tactics

- No new dependency. No code change. No schema-version bump.
- Do not modify any of the existing 12 entries.
- Do not author entries for any sign outside the 5 colors listed above (the rest of the vocab needs real reviewer expertise).
- No diagnostic-language cues.

## Handoff

When all three criteria are met, do the comprehensive final halt: set `<stop-orchestrator/>`, write the close session log, exit.
