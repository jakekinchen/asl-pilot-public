# /goal-update (retired)

> Mission 3R update (2026-05-25): the Claude slash-command goal-update path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not edit `GOAL.md`, scaffold prompts, write session logs, commit, launch Brev, push, or edit repo state from this command.

## current replacement

Current goal changes happen through the Codex workflow:

- The **Codex executor** follows [`GOAL.md`](../../GOAL.md), the active prompt named there, and [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md).
- The **Codex observer** follows [`docs/observer-prompt.md`](../../docs/observer-prompt.md) and [`docs/runbooks/observer-runbook-codex.md`](../../docs/runbooks/observer-runbook-codex.md). It may redirect by editing `GOAL.md` or the active prompt, then writing an observer session log.

To start the full Codex pair after the intended account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

## why this command is closed

The old body edited mission state from inside the Claude command set and carried a Claude commit trailer. Mission 3R moved goal redirection into Codex observer decisions and Codex executor exit handling. Historical context remains available in prior commits and session logs; current goal updates must use the Codex runbooks.
