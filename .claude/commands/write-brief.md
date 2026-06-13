# /write-brief (retired)

> Mission 3R update (2026-05-25): the Claude slash-command brief-writing path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not create briefs, update task state, launch Brev, push, or edit repo state from this command.

## current replacement

Current slice scoping is controlled by:

1. [`GOAL.md`](../../GOAL.md)
2. the active per-milestone prompt named by `GOAL.md`
3. [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md)
4. [`docs/observer-messages/observer-log.md`](../../docs/observer-messages/observer-log.md)

The Codex executor completes exactly one smallest useful reviewable slice per turn, writes a numbered session log, stages only scoped files, commits, and stops before human approval, Brev spend, destructive cleanup, push, or final-gate policy changes.

To start the full Codex pair after the intended account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

## why this command is closed

The old body created planning notes and changed task state from inside the Claude command set. Mission 3R moved slice selection and documentation into the Codex executor contract and Codex observer redirects. Historical context remains available in prior commits and session logs; current scoping must use the Codex runbook.
