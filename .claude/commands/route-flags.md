# /route-flags (retired)

> Mission 3R update (2026-05-25): the Claude slash-command flag-routing path is retired for ASL Pilot. If this command is invoked, stop immediately. Do not route step flags, update task state, edit architecture decisions, write area lesson indexes, launch Brev, push, or edit repo state from this command.

## current replacement

The active loop is **Codex executor + Codex observer**.

For executor closeout and blocker classification, follow [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md). Record the current slice in one numbered session log under [`docs/session-logs/`](../../docs/session-logs/), and classify blockers as `training-readiness`, `Brev-human-action`, or `final-promotion` when Mission 3R requires it.

For observer redirects or nudges, follow [`docs/runbooks/observer-runbook-codex.md`](../../docs/runbooks/observer-runbook-codex.md) and [`docs/observer-prompt.md`](../../docs/observer-prompt.md).

## why this command is closed

The old body routed Claude step-9 flags into `MVP_TASKS.md`, planning briefs, area `LESSONS.md` files, `DECISIONS.md`, and validation artifacts. Mission 3R moved that authority into the Codex executor session log and Codex observer decision path. Historical context remains available in prior commits and session logs; current flag handling must use the Codex runbooks.
