# /session-start (retired)

> Mission 3R update (2026-05-25): the Claude slash-command session-start path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not select a task, start the retired test loop, route blockers to the old orchestrator, launch Brev, push, or edit repo state from this command.

## current replacement

The active loop is **Codex executor + Codex observer**.

For a single Codex executor turn, read:

1. [`GOAL.md`](../../GOAL.md)
2. the active per-milestone prompt named in `GOAL.md`
3. [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md)
4. [`docs/observer-messages/observer-log.md`](../../docs/observer-messages/observer-log.md)

Then complete exactly one smallest useful reviewable slice, validate it, write a numbered session log, stage only scoped files, commit, and stop before human approval, Brev spend, destructive cleanup, push, or final-gate policy changes.

To start the Codex pair after the intended account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

## why this command is closed

The old body used the retired task graph and brief workflow as a live Claude session bootstrap, then handed control to the retired test loop. Mission 3R moved session start, slice selection, and blocker routing into the Codex executor runbook and Codex observer channel. Historical context remains available in prior commits and session logs; current sessions must use the Codex runbook.
