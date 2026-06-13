# Vocabulary Reviewer-Chain Doc Goal Loop Prompt

Interim mission 3h, the last queued non-training mission before the autonomous loop halts on mission 3's human-collection blocker. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

Author `docs/runbooks/vocabulary-reviewer-chain.md`, an operator-facing runbook that documents the flow from the canonical TypeScript vocabulary to the optional Ed25519-signed external reviewer-authority chain, plus the audit-script chain that validates each step. The reader's goal is: "I want to add a vocabulary item — what do I do?" OR "I want to commission external review — what's the workflow?"

## Source Of Truth

1. [`GOAL.md`](../../GOAL.md) and `interim mission 3h` block.
2. [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts) — the canonical TypeScript vocabulary (100 items).
3. [`scripts/promote_source_curated_vocabulary.mjs`](../../scripts/promote_source_curated_vocabulary.mjs) — generates `docs/review/final-vocabulary-review.json` from vocabulary.ts.
4. [`docs/review/final-vocabulary-review.json`](../review/final-vocabulary-review.json) — the source-curated evidence packet (currently `source_curated_no_external_review`).
5. [`scripts/vocabulary_review_utils.mjs`](../../scripts/vocabulary_review_utils.mjs) — shared validation logic.
6. [`scripts/audit_vocabulary_review.mjs`](../../scripts/audit_vocabulary_review.mjs) and [`scripts/audit_hint_pedagogy_review.mjs`](../../scripts/audit_hint_pedagogy_review.mjs) and [`scripts/audit_downstream_vocabulary_provenance.mjs`](../../scripts/audit_downstream_vocabulary_provenance.mjs) and [`scripts/audit_source_register.mjs`](../../scripts/audit_source_register.mjs) — the audit chain.
7. [`scripts/import_vocabulary_review.mjs`](../../scripts/import_vocabulary_review.mjs) — imports an external-reviewer signed packet (Ed25519).
8. [`data/vocabulary-review/`](../../data/vocabulary-review/) — packet/receipt/authority storage for external review.

## Acceptance Criteria

All three must be true:

1. **`docs/runbooks/vocabulary-reviewer-chain.md` exists** and covers:
   - Chain diagram/table: vocabulary.ts → promote_source_curated_vocabulary → final-vocabulary-review.json → (optional) external Ed25519 packet → reviewer receipt → audit chain.
   - "Adding a vocabulary item" — exact commands.
   - "Commissioning external review" — exact commands.
   - "Auditing the chain" — which audits run when and what they check.
   - Failure-modes table sourced from real observer findings (the `vocabulary_source.sha256` mismatch in [`docs/session-logs/006-mission-2-task-006-brev-scripts.md`](../session-logs/006-mission-2-task-006-brev-scripts.md) and the diagnostic-language gate added in mission 3f are real examples).
2. **Cross-references intact**: the new runbook links to canonical files + relevant ARCHITECTURE.md anchors (`#arch-active-module`, `#arch-vocab-hints`, `#arch-data-provenance`).
3. **No regression**: `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_no_raw_video_upload`, `audit_hint_pedagogy_review`, `audit_vocabulary_review`, `audit_downstream_vocabulary_provenance` all pass.

## Forbidden Tactics

- No new dependency. No code change. No new audit script.
- Do not invent steps the existing scripts don't actually implement (read the scripts before describing them).

## Handoff

When all three criteria are met, the autonomous fallback queue is exhausted. Transition to **stop-no-next-milestone** with `<stop-orchestrator/>` and a final halt log that names mission 3's human-action blocker (first-party clip collection per [`docs/runbooks/first-party-collection.md`](../runbooks/first-party-collection.md)) as the unresolved gate.
