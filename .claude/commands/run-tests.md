# /run-tests (retired)

> Mission 3R update (2026-05-25): the Claude slash-command test runner is retired for ASL Pilot. If this command is invoked, stop immediately. Do not choose test scope, run smoke checks, launch training, commit, push, or edit repo state from this command.

## current replacement

The active loop is **Codex executor + Codex observer**.

For each executor slice, follow [`docs/runbooks/codex-goal-loop.md`](../../docs/runbooks/codex-goal-loop.md): run the specific existing repo audit, smoke, or test command required by the active prompt and touched files, then record the exact command and result in one numbered session log under [`docs/session-logs/`](../../docs/session-logs/).

For Mission 3R, the active validation surfaces include [`scripts/audit_loop_premise.mjs`](../../scripts/audit_loop_premise.mjs), [`scripts/audit_final_manifests.py`](../../scripts/audit_final_manifests.py), local pre-Brev checks, and direct slice-specific `rg` or `git diff --check` commands.

## why this command is closed

The old body let a Claude slash command select test scope from an active brief, run integration/browser/model checks, and record results. Mission 3R moved validation selection into the Codex executor turn contract and active prompt. Historical context remains available in prior commits and session logs; current validation must use direct commands plus the Codex runbook.
