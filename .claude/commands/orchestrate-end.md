# /orchestrate-end (retired)

> Mission 3R update (2026-05-25): the Claude slash-command closeout path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not stage files, commit, update task state, set stop sentinels, launch Brev, push, or edit repo state from this command.

## current replacement

Current closeout is part of each Codex executor turn:

1. read [`GOAL.md`](../../GOAL.md) and the active prompt named there;
2. follow [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md);
3. validate the scoped slice;
4. write a numbered session log under [`docs/session-logs/`](../../docs/session-logs/);
5. stage only scoped files;
6. commit with `Co-Authored-By: Codex Executor <executor@codex>`;
7. stop before human approval, Brev spend, destructive cleanup, push, or final-gate policy changes.

To start the full Codex pair after the intended account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

## why this command is closed

The old body closed a Claude-run slice, updated the round task graph, and carried a Claude commit trailer. Mission 3R replaced that control flow with Codex executor + Codex observer. Historical context remains available in prior commits and session logs; current closeout must use the Codex runbook.
