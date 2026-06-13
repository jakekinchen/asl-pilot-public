# Team Protocol

## role topology

| role | owns | does not own |
|---|---|---|
| human | final authority, scope approvals, push permission, no-pretrained/privacy exceptions, downscope approval | carrying session memory manually |
| thin lead | team setup, protocol enforcement, escalation handling, lead handoff | deep implementation across every area |
| orchestrator | deriving state from files, writing briefs, routing flags, closing rounds | coding all slices |
| implementer-per-area | executing one area slice with tests/wiring/checks | changing architecture silently or bundling unrelated work |

## direct-comms rule

Agents communicate through durable artifacts. Cross-area discoveries become routed flags, not private side chats.

## escalation taxonomy

| category | when to use | expected action |
|---|---|---|
| architecture drift | cited anchor is wrong, missing, or contradicted | pause slice; update architecture or task before continuing |
| task ambiguity | brief/task target conflicts or is stale | orchestrator rewrites brief/task |
| quality gap | tests/wiring/validation/acceptance insufficient | fix tests/checks before green accepted |
| safety/compliance gap | no-pretrained, privacy, or raw-video boundary at risk | immediate human escalation |

## single-operator fallback

Use the same workflow in sequence:

```text
/team-start
/orchestrate-start
/write-brief <task>
/session-start
/tdd <feature>
/session-end
/orchestrate-end
```

## push rule

Push happens only at `/orchestrate-end`, once per round, with explicit human go.

## premise audit discipline

Whenever the orchestrator or observer reads a halt log, a STOP session log, or any narrative framing the loop as "blocked on X" / "paused on X" / "awaiting X", the next action is `node scripts/audit_loop_premise.mjs --json` — **before** concurring with the framing. The audit cross-references GOAL.md's stated blocker against `ARCHITECTURE.md` anchor text, `docs/model/dataset-source-register.json`, and on-disk `data/manifests/*.json`. Exit 0 means the framing is consistent with current state; exit 1 means a narrative-vs-state contradiction and the framing must be corrected before any further work is sequenced on top of it.

This discipline exists because of the 25-commit detour documented in [`docs/session-logs/041-postmortem-first-party-misread.md`](session-logs/041-postmortem-first-party-misread.md). Halt logs accumulate authority — each subsequent iteration that inherits the prior conclusion without re-deriving it from architecture compounds the original error. The cross-runtime orchestrator-observer pair is only a check if both runtimes re-derive premise from upstream sources every pass; if both inherit the same downstream paraphrase, the second runtime becomes an echo, not a check.

## commit-reference policy

When referencing commits in durable docs (architecture, decisions, session logs, briefs), **prefer session-log paths over raw SHAs**. SHAs are volatile after any history rewrite (e.g. `task-027`'s `git filter-repo` pass); session-log paths are not. The mapping table for the 2026-05-23 rewrite lives in [`docs/session-logs/005-task-027-history-rewrite.md`](session-logs/005-task-027-history-rewrite.md). When a SHA must be cited inline (commit messages, post-hoc audit narratives, validation receipts), still record the matching session-log path in the same paragraph so the reference survives the next rewrite.
