# CLAUDE.md — repo root

> Mission 3R update (2026-05-25): the Claude/Happy orchestrator path is retired for this repo. The active loop is **Codex executor + Codex observer**. Do not use the retired Claude slash-command loop or `scripts/start_claude_loop.sh` for current work. Read [`GOAL.md`](GOAL.md) and [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md), then use `bash scripts/start_codex_goal_loop.sh --role both --dry-run` if a local loop launch check is needed.

This is the read-order pointer for any agent starting work on this repo. Per [`docs/team-protocol.md`](docs/team-protocol.md), follow the durable-file workflow: architecture, decisions, tasks, lessons, and validation live in files, not in chat memory.

## read order (any new session)

1. [`GOAL.md`](GOAL.md) — **active Codex goal loop prompt; the Codex executor re-reads this every turn.**
2. [`README.md`](README.md) — current project framing and the long `Verify` audit chain.
3. [`STAGE_GATE_STATUS.md`](STAGE_GATE_STATUS.md) — where the round is.
4. [`docs/session-logs/`](docs/session-logs/) — most recent numbered session log; the gap audit at `001-gap-audit.md` is required reading.
5. [`PRESEARCH.md`](PRESEARCH.md), [`RESEARCH.md`](RESEARCH.md) — discovery artifacts.
6. [`DECISIONS.md`](DECISIONS.md) — locked / proposed / open / deferred / research-required.
7. [`ARCHITECTURE.md`](ARCHITECTURE.md) — anchored invariants. Every implementation slice must cite one or more `#arch-*` anchors.
8. [`DIAGRAM_PLAN.md`](DIAGRAM_PLAN.md) — diagrams to maintain.
9. [`MVP_TASKS.md`](MVP_TASKS.md) — annotated task graph with repo-state for each task.
10. [`docs/team-protocol.md`](docs/team-protocol.md), [`docs/orchestrator-briefing.md`](docs/orchestrator-briefing.md), [`docs/tdd-brief-template.md`](docs/tdd-brief-template.md), [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md).
11. [`docs/48h-execution-playbook.md`](docs/48h-execution-playbook.md) — time-pressure guidance (not a literal 48-hour budget; see [`#arch-downscope-ladder`](ARCHITECTURE.md#arch-downscope-ladder)).
12. The relevant area `CLAUDE.md` for the work you're about to do: [`web/CLAUDE.md`](web/CLAUDE.md), [`scripts/CLAUDE.md`](scripts/CLAUDE.md), [`data/CLAUDE.md`](data/CLAUDE.md), [`docs/CLAUDE.md`](docs/CLAUDE.md), [`infra/CLAUDE.md`](infra/CLAUDE.md), [`models/CLAUDE.md`](models/CLAUDE.md), [`product/CLAUDE.md`](product/CLAUDE.md).
13. [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md) — the 95+ hard gates the existing repo enforces. ARCHITECTURE.md anchors reference it; do not duplicate it.

## historical state (round 001, 2026-05-23)

For current state, read [`GOAL.md`](GOAL.md), especially the `current mission` block.

- Plan amendment round just completed.
- Architecture finalized; four decisions locked.
- Stage 4 execution **blocked on [`task-026`](MVP_TASKS.md#task-026)** — Stage A / MediaPipe vestige removal. First JIT brief at [`docs/briefs/001-stage-a-vestige-removal.md`](docs/briefs/001-stage-a-vestige-removal.md).
- Recommended: spawn `task-026` into its own session/worktree.

## hard rules

- No pretrained CV/sign/landmark/model dependencies in the promoted lane. (`#arch-no-pretrained`)
- No raw learner video upload during normal practice. (`#arch-camera-privacy`)
- Every task cites architecture anchors. Every commit names the task + brief + anchors + check.
- **Commit at every completed slice** — never let multiple slices accumulate uncommitted. See commit message template in [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md).
- **Never push to remote without explicit human approval.** Autonomous loops never push.
- **Never `--no-verify` or `--amend`** unless explicitly directed; fix the hook failure and create a new commit instead.
- **Never `git add -A` or `git add .`** — always stage specific paths to avoid sweeping in raw-data caches or secrets.
- Do not hand-edit [`web/public/model/model-card.json`](web/public/model/model-card.json); use [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs).
- Do not create a parallel audit system; extend the existing `node scripts/audit_*.mjs` chain (200+ scripts).
- Heavy GPU training → Brev. Smoke / eval / export / audits → local Mac Studio MPS. (`#arch-gpu-execution`)
- Existing 95+ hard gates in [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md) are authoritative; ARCHITECTURE.md references them by name.

## autonomous workflow (current: Codex executor + Codex observer)

The current workflow is defined in [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md) and [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md):

- **Executor = Codex**. Each turn reads [`GOAL.md`](GOAL.md) plus the active per-milestone prompt, completes exactly one reviewable slice, validates it, writes a numbered session log, commits only scoped files, then stops.
- **Observer = Codex**. Reads [`docs/observer-prompt.md`](docs/observer-prompt.md) and [`docs/runbooks/observer-runbook-codex.md`](docs/runbooks/observer-runbook-codex.md). Decides: CONTINUE / NUDGE / REDIRECT / STOP / ESCALATE. Acts per the decision tree.

**Start command:** after the intended Codex account/profile is selected, run `bash scripts/start_codex_goal_loop.sh --role both --dry-run`, then `bash scripts/start_codex_goal_loop.sh --role both`. Heavy Brev training still requires explicit human approval before spend.

Coordination is **file-based**. Observer messages live under [`docs/observer-messages/`](docs/observer-messages/). Big redirects edit `GOAL.md` or the active prompt directly. Historical Claude slash-command helpers remain in `.claude/` for reference only and are not the active loop.

## slash commands

16 commands installed in [`.claude/commands/`](.claude/commands/): `check-arch`, `goal-update`, `loop-tick`, `model-audit`, `observer-check`, `orchestrate-end`, `orchestrate-start`, `preflight`, `route-flags`, `run-tests`, `session-end`, `session-start`, `tdd`, `team-start`, `wired`, `write-brief`.

Manual run: `/orchestrate-start` to claim the next task; `/orchestrate-end` to commit + log a slice.
Autonomous run: use `bash scripts/start_codex_goal_loop.sh --role both --dry-run`, then `bash scripts/start_codex_goal_loop.sh --role both`. See [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md) for current harness options.
