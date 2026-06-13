# /orchestrate-start (retired)

> Mission 3R update (2026-05-25): the Claude slash-command orchestration path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not author a planning brief, mark tasks in progress, write old session-control files, start Claude/Happy, launch Brev, or edit repo state from this command.

## current replacement

Current executor work starts from the Codex goal-loop contract:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

For a single Codex executor turn, read:

1. [`GOAL.md`](../../GOAL.md)
2. the active prompt named by `GOAL.md`
3. [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md)
4. [`docs/observer-messages/observer-log.md`](../../docs/observer-messages/observer-log.md)

Then complete exactly one smallest useful reviewable slice, validate it, write a numbered session log, commit scoped files only, and stop if the next step needs human approval, Brev spend, destructive cleanup, or final-gate policy changes.

## why this command is closed

The old body selected tasks for the retired runtime, authored planning briefs from the round-001 task graph, and wrote a legacy session-control file for in-process observer messaging. Mission 3R replaced that flow with the Codex executor + Codex observer workflow recorded in [`docs/session-logs/126-codex-loop-takeover.md`](../../docs/session-logs/126-codex-loop-takeover.md).

Leaving executable-looking task-selection instructions here would risk bypassing `GOAL.md` and the active per-milestone prompt. Historical context remains available in prior commits and session logs; current work must use the Codex runbook.
