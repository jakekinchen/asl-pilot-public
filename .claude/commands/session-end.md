# /session-end (retired)

> Mission 3R update (2026-05-25): the Claude slash-command session-end path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not run legacy slash-command checks, route old step flags, write dated old-format session logs, launch Brev, push, or edit repo state from this command.

## current replacement

The active loop is **Codex executor + Codex observer**.

For a single Codex executor closeout, follow [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md):

1. validate the touched slice with the relevant repo audit or test;
2. write one numbered session log under [`docs/session-logs/`](../../docs/session-logs/);
3. update lessons only when the slice adds a reusable rule;
4. stage only scoped files;
5. commit locally;
6. stop before human approval, Brev spend, destructive cleanup, push, or final-gate policy changes.

To start the Codex pair after the intended account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

## why this command is closed

The old body closed a Claude-era session by checking retired slash-command proof, surfacing old step flags, and writing dated session-log names. Mission 3R moved closeout into the Codex executor contract and session-log ledger. Historical context remains available in prior commits and session logs; current closeout must use the Codex runbook.
