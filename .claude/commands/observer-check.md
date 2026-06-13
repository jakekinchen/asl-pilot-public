# /observer-check (retired)

> Mission 3R update (2026-05-25): the Claude-side observer fallback is retired for ASL Pilot. If this command is invoked, stop immediately. Do not diagnose loop state, write observer messages, edit `GOAL.md`, commit, launch Brev, push, or edit repo state from this command.

## current replacement

The canonical observer is **Codex observer**, paired with the **Codex executor**.

For observer work, follow:

1. [`docs/runbooks/observer-runbook-codex.md`](../../docs/runbooks/observer-runbook-codex.md)
2. [`docs/observer-prompt.md`](../../docs/observer-prompt.md)
3. [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md)

To start the Codex pair after the intended account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

## why this command is closed

The old body kept an emergency Claude observer path alive, including permission to diagnose loop state, write observer messages, and sign commits as a Claude fallback observer. Mission 3R moved observer authority to the Codex observer runbook and file-backed observer prompt. Historical context remains available in prior commits and session logs; current observer passes must use the Codex observer path or wait for human direction.
