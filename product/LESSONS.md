# Product Lessons

Stable numeric lesson ids. Never reorder or reuse ids.

## template

```md
# 1. <lesson title>

date: YYYY-MM-DD
source slice: <brief/session>
source task: `MVP_TASKS.md#task-XXX`
anchors:
- `ARCHITECTURE.md#arch-...`

## context

## gotcha / pattern

## rule

## examples

## linked files
```

# 1. Hints stay descriptive of the canonical sign, never diagnostic of the learner

date: 2026-05-24
source slice: M2 slice 2 (initial 12 SIGN_HINT_METADATA entries) + M3f (REASON_COPY audit binding) + M3k/m (color + relative expansions)
source task: `MVP_TASKS.md#task-018`
anchors:
- `ARCHITECTURE.md#arch-vocab-hints`
- `ARCHITECTURE.md#arch-passfail-thresholds`

## context

`scripts/audit_hint_pedagogy_review.mjs` enforces a `DIAGNOSTIC_LANGUAGE_PATTERNS` regex set against three surfaces: per-item `coachingHint` in `docs/review/final-vocabulary-review.json`, every populated dimension in `web/src/lib/sign-hint-metadata.json`, and the typed `REASON_COPY` map in `web/src/components/PracticeApp.tsx`. The patterns reject "wrong / incorrect / inaccurate / sloppy", "not correct", "try again", "was off / incorrect / wrong", "you did/made/signed/moved/...", and "your X was/is/did/made/moved".

## gotcha / pattern

A naive copy reflex is to write "Your handshape was wrong" or "You did the location too high". The hard gate "Honest targeted hints" explicitly rejects that: the current rawframe-only model produces top-1 logits, not dimension-specific signals, so a per-dimension claim about WHAT the learner did wrong is fabricated. The structured cues exist to describe the CANONICAL form ("Palm faces forward", "Start near the chin and move outward") so the hint engine can spotlight one dimension when a coarse signal (camera too dark, not enough frames) points at it, without claiming the learner's specific attempt.

## rule

Every learner-facing hint string — `coachingHint`, every `SIGN_HINT_METADATA` dimension value, every `REASON_COPY` entry — describes either the canonical ASL form OR the runtime/camera state. It NEVER claims what the learner did wrong. The audit's regex catches the common diagnostic phrasings; add new patterns there if a new mode of drift appears.

## examples

`docs/session-logs/022-mission-3f-reason-copy-audit.md` records the extension of the audit to cover `REASON_COPY`. `docs/session-logs/028-mission-3k-color-hints.md` records a borderline catch: "Forehead." was rejected for being only 9 chars (below 10-char min), unrelated to diagnostic language but caught the same way.

## linked files

- [`scripts/audit_hint_pedagogy_review.mjs`](../scripts/audit_hint_pedagogy_review.mjs)
- [`web/src/lib/sign-hint-metadata.json`](../web/src/lib/sign-hint-metadata.json)
- [`web/src/components/PracticeApp.tsx`](../web/src/components/PracticeApp.tsx)
- [`docs/strategy-confidence-audit.md`](../docs/strategy-confidence-audit.md) hard gate "Honest targeted hints"
