# Claude Thread Rollover Runbook (Retired)

This runbook is historical for ASL Pilot. Do not use it to start, recover, or redirect the active project loop.

The active loop is now **Codex executor + Codex observer**. Use:

```sh
bash scripts/start_codex_goal_loop.sh --role both
```

For a dry run before changing accounts or profiles:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
```

Current operator procedure lives in:

- [`docs/runbooks/codex-goal-loop.md`](codex-goal-loop.md)
- [`docs/runbooks/observer-runbook-codex.md`](observer-runbook-codex.md)
- [`docs/observer-prompt.md`](../observer-prompt.md)
- [`scripts/start_codex_goal_loop.sh`](../../scripts/start_codex_goal_loop.sh)

## Historical Context

This file previously documented how to recover a high-context Claude/Happy executor thread after `context-rollover`. Mission 3R retired that executor path and re-centered the project on Codex. The old Claude procedure is intentionally not preserved as an executable checklist here because the current `GOAL.md` explicitly says not to start or resume Claude/Happy as the project orchestrator.

If older session logs reference this runbook, interpret those references as Claude-era history. For current work, re-read `GOAL.md`, the active per-milestone prompt, and `docs/runbooks/codex-goal-loop.md`.
