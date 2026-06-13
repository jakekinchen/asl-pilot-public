# Autonomous Codex Executor + Observer Protocol

This doc defines the active ASL Pilot autonomous workflow as of the Codex takeover. The previous Claude/Happy executor loop is retired for this repo unless the user explicitly re-enables it.

The active workflow uses two Codex roles:

| | Executor | Observer |
|---|---|---|
| Runtime | **Codex** in a dedicated executor session | **Codex** in a separate observer session |
| Cadence | Repeated one-slice `codex exec` turns | Slower scheduled `codex exec` observer passes |
| Prompt file | [`GOAL.md`](../GOAL.md) + active `docs/model/*-goal-loop-prompt.md` | [`observer-prompt.md`](observer-prompt.md) |
| Runbook | [`runbooks/codex-goal-loop.md`](runbooks/codex-goal-loop.md) | [`runbooks/observer-runbook-codex.md`](runbooks/observer-runbook-codex.md) |
| Writes | scoped implementation/doc edits, validation evidence, session logs, commits | doc/prompt/log edits only |
| Channel out | commits + `docs/session-logs/` | `docs/observer-messages/`, `GOAL.md`, observer session logs |
| Channel in | `GOAL.md`, active prompt, observer messages, current repo state | `GOAL.md`, active prompt, commits, session logs, audits |

The roles coordinate only through files in this repo. Chat memory is not source of truth.

## Start Command

After logging into the intended Codex account/profile:

```sh
cd /Users/kelly/Developer/asl-pilot
bash scripts/start_codex_goal_loop.sh --role both
```

Dry run:

```sh
bash scripts/start_codex_goal_loop.sh --role both --dry-run
```

The helper opens iTerm2 tabs for:

- `ASL Codex Executor`, resuming `.codex-executor-session-id`;
- `ASL Codex Observer`, resuming `.codex-observer-session-id`.

Both session-id files are local and gitignored.

## Executor Contract

Each executor turn performs one reviewable slice:

1. Read `GOAL.md`, then the active prompt named there.
2. Read recent observer messages.
3. Run `git status --short`.
4. Run `node scripts/audit_loop_premise.mjs --json`.
5. Pick the smallest useful evidence-producing step.
6. Edit only scoped files.
7. Run relevant validation.
8. Write a numbered session log under `docs/session-logs/`.
9. Commit only the scoped files for that slice.
10. Stop and report if the next step requires human approval, Brev spend, destructive cleanup, secrets, or a policy change.

The executor never pushes. It never uses `--no-verify`, `--amend`, or `git add -A`.

## Observer Contract

The observer evaluates and steers. It never writes implementation code.

Legal observer actions:

- `CONTINUE`: append a concise line to `docs/observer-messages/observer-log.md`.
- `NUDGE`: write a nudge file and append the observer log.
- `REDIRECT`: edit `GOAL.md` or the active per-milestone prompt and write an observer session log.
- `STOP`: set `<stop-orchestrator/>` in `GOAL.md` or record why the loop must halt.
- `ESCALATE`: use the approved research path, save the artifact, verify locally, then reduce to another decision.

Observer commits use:

```text
observer: <decision> - <slug>

task: observer-<decision>
brief: docs/session-logs/NNN-observer-<decision>.md
anchors: <if any>
check: n/a

Co-Authored-By: Codex Observer <observer@codex>
```

## Commit Cadence

| Trigger | Action |
|---|---|
| every completed executor slice | local commit |
| every completed task row | local commit + `MVP_TASKS.md` update |
| every new architectural decision | local commit including `DECISIONS.md` |
| every observer redirect/stop/nudge | local commit |
| any point | never push without explicit human approval |
| any point | never bypass hooks or amend commits without explicit human approval |

Executor commit template:

```text
<short subject under 70 chars>

task: <task or mission id>
brief: <active prompt or session log>
anchors: <#arch anchors or n/a>
check: <pass | fail | partial>
check command: <exact validation command>

<optional body>

Co-Authored-By: Codex Executor <executor@codex>
```

## Hard Rules

1. Durable files beat chat memory.
2. Never push without explicit human approval.
3. Never bypass hooks.
4. Never amend existing commits unless asked.
5. Never commit secrets.
6. Never delete `artifacts/` or `data/` paths without a brief that names exactly what is deleted and why.
7. Never hand-edit `web/public/model/model-card.json`; use the promotion script.
8. No pretrained CV/sign/landmark/model dependencies in the promoted lane.
9. Heavy final training on Brev requires explicit human approval before spend.
10. The observer does not implement; it steers the executor.

## Current Bias

The active recovery mission is to return to 95-label PopSign rawframe training readiness. Negative-challenge sourcing is final-promotion/calibration work unless `GOAL.md` is explicitly redirected back to that lane.
