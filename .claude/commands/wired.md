# /wired <flow> (retired)

> Mission 3R update (2026-05-25): the Claude slash-command reachability check is retired for ASL Pilot. If this command is invoked, stop immediately. Do not run smoke checks, invoke training commands, launch Brev, push, or edit repo state from this command.

## current replacement

The active loop is **Codex executor + Codex observer**.

For each executor slice, follow [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md): run the relevant repo audit or smoke command directly, record the exact command and result in one numbered session log under [`docs/session-logs/`](../../docs/session-logs/), then stage only scoped files and commit locally.

For Brev-related reachability, use [`docs/runbooks/brev-rawframe-training-handoff.md`](../../docs/runbooks/brev-rawframe-training-handoff.md) only after explicit human approval for paid provisioning.

## why this command is closed

The old body treated a Claude slash command as the place to prove runtime reachability and listed Brev shell invocation beside local app and audit entry points. Mission 3R moved evidence recording into Codex executor session logs and keeps paid Brev actions behind explicit human approval. Historical context remains available in prior commits and session logs; current reachability proof must use direct commands plus the Codex runbook.
