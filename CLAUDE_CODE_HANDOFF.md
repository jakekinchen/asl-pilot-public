# CLAUDE_CODE_HANDOFF

> Mission 3R update (2026-05-25): this Claude Code handoff is retained as historical context only. The active project loop is **Codex executor + Codex observer**. Do not use the retired Claude/Happy slash-command loop, `scripts/start_claude_loop.sh`, or old orchestrator session-id file for current work. Read [`GOAL.md`](GOAL.md), the active prompt named there, and [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md). Use `bash scripts/start_codex_goal_loop.sh --role both --dry-run` for a launch check.

## purpose

Historical seam between planning and Claude build sessions. Current Codex sessions should treat this as background after the active goal files and Codex runbook, not as the task picker.

## current state (round 001, 2026-05-23 — historical post-amendment)

- The plan folder has been **merged and amended** into the repo. See [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md) for what was reconciled and why.
- Architecture is finalized for round 1: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- Four locked decisions: see [`DECISIONS.md`](DECISIONS.md) "round-001 decisions" section.
- [`MVP_TASKS.md`](MVP_TASKS.md) is annotated: every task marks **DONE / PARTIAL / MISSING / BLOCKED / DEFERRED** with file pointers so the next session can verify each item against the actual repo as it executes.
- At round 001, Stage 4 implementation was **blocked on [`task-026`](MVP_TASKS.md#task-026)** (Stage A / MediaPipe vestige removal). First JIT brief: [`docs/briefs/001-stage-a-vestige-removal.md`](docs/briefs/001-stage-a-vestige-removal.md). Verify `GOAL.md`, `MVP_TASKS.md`, and current session logs before treating this as active.

## read order (current sessions, before doing anything)

1. [`GOAL.md`](GOAL.md) — **active Codex goal loop prompt; current mission + exit condition.**
2. The active per-milestone prompt named by `GOAL.md`.
3. [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md) — current executor contract.
4. [`docs/observer-messages/observer-log.md`](docs/observer-messages/observer-log.md) — latest observer status and pending nudges.
5. [`README.md`](README.md)
6. [`STAGE_GATE_STATUS.md`](STAGE_GATE_STATUS.md)
7. [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md) — required context for round-001 decisions
8. [`DECISIONS.md`](DECISIONS.md) — round-001 decisions explain why the imported plan was amended
9. [`ARCHITECTURE.md`](ARCHITECTURE.md)
10. [`MVP_TASKS.md`](MVP_TASKS.md) — verify the DONE-state of each task you depend on
11. [`CLAUDE.md`](CLAUDE.md), then the area `CLAUDE.md` for historical agent-specific context
12. [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md) — 95+ hard gates the existing audit chain enforces

## first job

For current Codex executor turns, do not use this historical handoff to select a task. Instead:

- follow `GOAL.md` and the active per-milestone prompt;
- run the premise/status checks from [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md);
- complete one smallest useful reviewable slice;
- stop before paid Brev provisioning, final-gate changes, or any destructive cleanup without explicit human approval.

If a human explicitly redirects back to the round-001 `task-026` Stage A vestige-removal slice, use [`docs/briefs/001-stage-a-vestige-removal.md`](docs/briefs/001-stage-a-vestige-removal.md) and validate with the current audit chain.

## autonomous mode (current Codex executor + Codex observer)

Start the current pair only after the intended Codex account/profile is selected:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
bash scripts/start_codex_goal_loop.sh --role both
```

- Executor state resumes through `.codex-executor-session-id`.
- Observer state resumes through `.codex-observer-session-id`.
- Observer messages are file-backed under [`docs/observer-messages/`](docs/observer-messages/); there is no in-process message channel between sessions.
- The executor commits at every completed slice. It never pushes.
- Stop the loop by writing `<stop-orchestrator/>` to `GOAL.md` or by stopping the repo-local Codex harness.
- Full protocol: [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md) and [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md).

## forbidden behavior

- Do not invent architecture inside task planning. Amend [`ARCHITECTURE.md`](ARCHITECTURE.md) instead.
- Do not start implementation before reading [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md).
- Do not rely on chat memory as source of truth.
- Do not re-add pretrained CV/sign/landmark/model dependencies to the promoted lane.
- Do not upload raw learner video in normal practice.
- Do not claim active recognition coverage beyond validation evidence.
- Do not create a parallel audit system. Extend the existing `scripts/audit_*.mjs` chain.
- Do not hand-edit [`web/public/model/model-card.json`](web/public/model/model-card.json).
- Do not run heavy training locally; route to Brev (`#arch-gpu-execution`) only after explicit human approval for spend.

## output required from every build session

- Numbered session log under [`docs/session-logs/`](docs/session-logs/).
- Updated [`STAGE_GATE_STATUS.md`](STAGE_GATE_STATUS.md) checkboxes when a gate closes or opens.
- Updated [`MVP_TASKS.md`](MVP_TASKS.md) status when a task progresses.
- A brief under [`docs/briefs/NNN-*.md`](docs/briefs/) when starting a non-trivial in_progress implementation slice.
- Carry-forward triaged at session end.
- **One local commit per completed slice** following the heredoc template in [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md). Never `--no-verify`, never `--amend`, never `git add -A`.
- Push only with explicit human go.
