# /loop-tick (retired)

> Mission 3R update (2026-05-25): the Claude slash-command loop is retired for ASL Pilot. If this command is invoked, stop immediately and do not schedule a wake, write old orchestrator session files, start Claude/Happy, launch Brev, or edit repo state.

## current replacement

The active loop is **Codex executor + Codex observer**:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

Current executor turns follow:

1. [`GOAL.md`](../../GOAL.md)
2. the active prompt named by `GOAL.md`
3. [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md)
4. [`docs/observer-messages/observer-log.md`](../../docs/observer-messages/observer-log.md)

## why this command is closed

The old body of this command described a Claude/Happy executor loop with slash-command wake scheduling and Claude context-health rollover. That path is no longer the active project control plane after the Codex takeover recorded in [`docs/session-logs/126-codex-loop-takeover.md`](../../docs/session-logs/126-codex-loop-takeover.md).

Leaving executable-looking startup, wake, and commit instructions here would risk sending a future operator back into the retired runtime. Historical context remains available in prior commits and session logs; current work must use the Codex runbook.
