# Observer Messages

This directory is the **file-based message channel** between the **Codex observer** and the **Codex executor**. Because the two agents run in separate Codex sessions, they cannot use in-process SendMessage; instead, the observer writes here and the executor checks this directory during each goal-loop turn.

See [`../observer-prompt.md`](../observer-prompt.md) for the observer's decision tree and [`../autonomous-orchestrator-protocol.md`](../autonomous-orchestrator-protocol.md) for the full file-backed workflow.

## Files

- **`observer-log.md`** — append-only one-line-per-pass log written by Codex on every observer pass (CONTINUE / NUDGE / REDIRECT / STOP / ESCALATE). The executor checks this for the most recent entry to know whether to expect a pending intervention.
- **`NNN-nudge-<slug>.md`** — tactical hint files from the observer. Numbered sequentially. The executor reads any nudge whose number is greater than the last one acknowledged.
- **`NNN-redirect-<slug>.md`** — used only when the observer didn't edit a durable goal file directly but wants to leave a redirect note alongside. (Most REDIRECT actions edit `GOAL.md` or the active per-milestone prompt directly; this file is for cases where the redirect needs explanation that wouldn't fit cleanly in those files.)

## Acknowledgement protocol

The Codex executor turn does:

1. Reads the highest-numbered nudge that does not yet have `ack <NNN>` in `observer-log.md`.
2. Either incorporates the hint into the current slice (preferred) or appends `defer <NNN>: <reason>` to `observer-log.md` if the hint isn't actionable in the current scope.
3. After acting, appends `ack <NNN>` to `observer-log.md`.

Un-acked nudges older than **3 executor turns** are escalated by the observer to REDIRECT (per `docs/observer-prompt.md`).

## File naming examples

```
observer-log.md
001-nudge-mediapipe-import-regression.md
002-nudge-storage-budget-thresholds.md
003-redirect-defer-handboxnet.md
```

## Commit etiquette

The observer commits files in this directory with `Co-Authored-By: Codex Observer <observer@codex>` in the trailer and the message template:

```
observer: <CONTINUE|NUDGE|REDIRECT|STOP|ESCALATE> NNN — <slug>

task: observer-<kind>
brief: docs/observer-messages/NNN-<kind>-<slug>.md (or docs/session-logs/NNN-observer-*.md)
anchors: <if any>
check: n/a
```

The executor's acks just append to `observer-log.md` and do not need their own commit (folded into the next normal slice commit).

## What this directory is not

- Not a place for implementation code.
- Not a place for the executor to write (the executor only appends `ack`/`defer` lines to `observer-log.md`; everything else here is observer-authored).
- Not a place for secrets, API responses, or learner data.
