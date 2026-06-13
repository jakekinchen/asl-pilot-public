# Stale SHA Cleanup Goal Loop Prompt

Interim mission 3g. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

[`docs/session-logs/005-task-027-history-rewrite.md`](../session-logs/005-task-027-history-rewrite.md) records that the `git filter-repo` pass to remove 4 large blobs rewrote every commit's SHA. Several durable files still reference the pre-rewrite SHAs. Those references are stale (the old SHAs don't resolve) but the docs remain readable because the file paths + commit subjects still convey intent. This mission replaces each stale SHA with its post-rewrite SHA (from the mapping table I just rebuilt below) and adds a one-line policy entry in the team protocol favoring session-log paths over raw SHAs.

## Mapping (old → new, verified via `git log --all --format="%h %s"`)

| old | new | commit subject |
|---|---|---|
| `848aa06` | `179a80d` | Bootstrap round-001 plan-merge |
| `843130c` | `a861c27` | Orchestrator workflow: autonomous loop, observer |
| `b81efc5` | `ceef893` | task-026 §A web/ source + assets + lock |
| `27e2d8d` | `eff86be` | task-026 §B 41 script deletions |
| `c7208b2` | `af47d98` | task-026 §C audits + claim matrix + UI drop |
| `a43a18d` | `c534036` | task-026 §D 313 doc files |
| `17d8385` | `c3f9e02` | task-026 §E artifacts untrack + .gitignore |
| `79c0f50` | `2a65ff6` | task-026 §H no-pretrained-lane-audit receipt |
| `63ea572` | `5b885b1` | task-026 validation pass |
| `ca1a38f` | `a52eb15` | task-026 closeout |
| `b48bcf4` | `b25e463` | Merge task-026 into compound-plan-m0 |
| `3c91e28` | `8759ffd` | Regenerate browser-onnx-wiring smoke |
| `3a9096e` | `e854cd6` | goal: roll mission forward (mission 2) |
| `1907425` | `f007c72` | Promote Stage A brown-chair teacher frontier |
| `906a42d` | (no mapping recorded; pre-existing big-file commit, rewritten without `supervision.jsonl` blob) | — |
| `f1a0d1f` | (no mapping recorded; pre-existing big-file commit, rewritten without HDF5 blobs) | — |

For the two unmapped SHAs, leave them in place but annotate: `(rewritten by task-027; see docs/session-logs/005-task-027-history-rewrite.md for the migration record)`.

## Files to touch

- [`STAGE_GATE_STATUS.md`](../../STAGE_GATE_STATUS.md)
- [`DECISIONS.md`](../../DECISIONS.md)
- [`GOAL.md`](../../GOAL.md)
- [`docs/session-logs/003-mission-2-rawframe-trainability.md`](../session-logs/003-mission-2-rawframe-trainability.md)
- [`docs/session-logs/004-push-blocker-large-files.md`](../session-logs/004-push-blocker-large-files.md)
- [`docs/team-protocol.md`](../team-protocol.md) — append a one-line "commit-reference policy" note: prefer session-log paths over raw SHAs.

## Acceptance Criteria

1. After the slice, `git rev-parse <each-old-sha>` still doesn't resolve, but the affected files no longer contain those literal old SHAs (verified via `grep -F` per file).
2. Files still read clearly: a human can follow the chain of commits by clicking the new SHA links in `git log` OR by reading the session-log paths the docs reference.
3. No regression: `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_no_raw_video_upload`, `audit_hint_pedagogy_review` all pass.

## Forbidden Tactics

- No new dependency. No new audit script. No code change.
- Do not rewrite history again.
- Do not edit `docs/session-logs/005-task-027-history-rewrite.md` itself — that's the historical record of the rewrite and must stay authentic.

## Handoff

When all three criteria are met, redirect GOAL.md `current mission` to interim mission 3h.
