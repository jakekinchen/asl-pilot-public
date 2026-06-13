# Executor / Reviewer Pair Programming Session

This repo's pair-programming session is a supervised Codex loop:

- **Executor** means the Codex executor. It implements one smallest useful,
  reviewable slice from `GOAL.md` and the active per-milestone prompt.
- **Reviewer** means the Codex observer. The repo mostly calls this role
  "observer"; in pair-programming terms it is the reviewer that audits the
  executor's last slice and decides whether to continue, nudge, redirect, stop,
  or escalate.
- **Supervisor** means the shell loop that runs exactly one executor turn and
  then exactly one reviewer turn against the resulting repo state.

The roles coordinate through repo files, commits, numbered session logs, `/tmp`
logs, and Codex session id marker files. Chat memory is not the source of truth.

## Normal Startup

Start from the repo root:

```sh
cd /Users/kelly/Developer/asl-pilot
git status --short
codex doctor
node scripts/audit_codex_pair_state.mjs
bash scripts/start_codex_goal_loop.sh --role supervisor --dry-run
bash scripts/start_codex_goal_loop.sh --role supervisor
```

The supervised mode is the default path. It opens one iTerm2 tab named
`ASL Codex Pair Supervisor`, which runs:

```sh
bash scripts/run_codex_pair_cycle.sh --loop
```

Use a foreground one-shot cycle when debugging without iTerm2:

```sh
bash scripts/run_codex_pair_cycle.sh --once
```

Legacy separate tabs still exist:

```sh
bash scripts/start_codex_goal_loop.sh --role both
bash scripts/start_codex_goal_loop.sh --role executor
bash scripts/start_codex_goal_loop.sh --role observer
```

Use those only for deliberate debugging. Do not run legacy mode at the same
time as the supervisor.

## One Supervised Cycle

`scripts/run_codex_pair_cycle.sh` performs this sequence:

1. Creates the lock directory `/tmp/asl-pilot-codex-pair.lock`.
2. Runs `node scripts/audit_codex_pair_state.mjs`.
3. Refuses to start if the worktree is dirty, unless `--allow-dirty` is passed.
4. Reads `GOAL.md`.
5. If `<stop-orchestrator/>` appears near the top of `GOAL.md`, skips the
   executor and runs the reviewer only.
6. Otherwise runs the Codex executor prompt through `codex exec resume` when a
   marker exists, falling back to `codex exec` only when no reusable session
   exists or resume fails.
7. Writes executor output to `/tmp/asl-pilot-codex-executor-*.log` and
   `/tmp/asl-pilot-codex-executor-last-message.md`.
8. Records the latest executor session id in `.codex-executor-session-id` using
   `scripts/record_latest_codex_session_id.mjs`.
9. Runs the Codex reviewer prompt through `codex exec` or `codex exec resume`.
10. Writes reviewer output to `/tmp/asl-pilot-codex-observer-*.log` and
    `/tmp/asl-pilot-codex-observer-last-message.md`.
11. Records the latest reviewer session id in `.codex-observer-session-id`.
12. Runs `node scripts/audit_codex_pair_state.mjs` again.
13. In `--loop` mode, sleeps for `PAIR_SLEEP_SECONDS` and repeats.

The default sleep is 30 seconds. Override it with:

```sh
PAIR_SLEEP_SECONDS=120 bash scripts/run_codex_pair_cycle.sh --loop
```

By default the supervisor resumes the existing executor and reviewer sessions
recorded in `.codex-executor-session-id` and `.codex-observer-session-id`.
Use `ASL_PILOT_EXECUTOR_RESUME=0` or `ASL_PILOT_OBSERVER_RESUME=0` only for a
deliberate recovery pass that needs a fresh Codex thread.

## Executor Contract

The executor's prompt is embedded in `scripts/run_codex_pair_cycle.sh` and
mirrors `docs/runbooks/codex-goal-loop.md`.

Each executor turn must:

1. Read `GOAL.md`.
2. Read the active `docs/model/*-goal-loop-prompt.md` named by `GOAL.md`.
3. Run `git status --short`.
4. Run `node scripts/audit_loop_premise.mjs --json`.
5. Complete exactly one smallest useful reviewable slice.
6. Run the validation relevant to that slice.
7. Write a numbered session log under `docs/session-logs/`.
8. Commit only scoped files for that slice.
9. Stop instead of guessing if the next action needs human approval, Brev
   spend, destructive cleanup, a final-gate policy change, or a push.

The executor must not push, bypass hooks, amend commits, make reviewer-only
redirect decisions, spend Brev money without recorded human approval, import
unapproved media, or change final readiness claims outside the active prompt.

## Reviewer Contract

The reviewer follows `docs/runbooks/observer-runbook-codex.md` and
`docs/observer-prompt.md`. It reviews the latest executor evidence, not old
session memory.

Before deciding, the reviewer reads:

- latest user instruction;
- `GOAL.md`;
- the active per-milestone prompt;
- `git status --short`;
- `git log --oneline -10`;
- `node scripts/audit_loop_premise.mjs --json`;
- latest numbered `docs/session-logs/` entry;
- `docs/observer-messages/observer-log.md`;
- `/tmp/asl-pilot-codex-executor-*.log`;
- `.codex-executor-session-id` and the matching `~/.codex/sessions/**/*.jsonl`.

The reviewer then chooses exactly one action:

| Decision | Meaning | Allowed writes |
|---|---|---|
| `CONTINUE` | Executor progress is in scope and measurable. | Usually `docs/observer-messages/observer-log.md`; if handing off to a bounded next prompt, also `GOAL.md`, active prompt docs, and a numbered observer log. |
| `NUDGE` | The executor needs a tactical correction. | `docs/observer-messages/NNN-nudge-*.md` and `observer-log.md`. |
| `REDIRECT` | Durable instructions are wrong or stale. | `GOAL.md`, active prompt docs, `docs/session-logs/NNN-observer-redirect.md`. |
| `STOP` | The mission is complete, unsafe to continue, or waiting on a human. | `<stop-orchestrator/>` in `GOAL.md`, observer log/session log, and Brev default-off evidence when relevant. |
| `ESCALATE` | More research is required before steering. | `artifacts/research/observer-NNN-*`, then a reduced decision. |

The reviewer must not write implementation code, commit implementation changes,
push, bypass hooks, amend commits, delete source/data/artifact paths, transmit
secrets, or launch Brev spend without explicit human approval.

## Scripts That Facilitate The Pair

| Script | Purpose | Common commands |
|---|---|---|
| `scripts/start_codex_goal_loop.sh` | Opens iTerm2 tabs or the supervisor tab. Writes temporary launchers under `/tmp/asl-pilot-codex-*.sh`. | `bash scripts/start_codex_goal_loop.sh --role supervisor`; `bash scripts/start_codex_goal_loop.sh --role supervisor --dry-run` |
| `scripts/run_codex_pair_cycle.sh` | Runs the actual supervised executor-then-reviewer cycle. Maintains the `/tmp/asl-pilot-codex-pair.lock` lock. | `bash scripts/run_codex_pair_cycle.sh --once`; `bash scripts/run_codex_pair_cycle.sh --loop`; `bash scripts/run_codex_pair_cycle.sh --once --dry-run`; `bash scripts/run_codex_pair_cycle.sh --once --allow-dirty` |
| `scripts/audit_codex_pair_state.mjs` | Reports branch, HEAD, active prompt, stop sentinel, session marker files, session metadata, live processes, latest logs, dirty files, and warnings. | `node scripts/audit_codex_pair_state.mjs`; `node scripts/audit_codex_pair_state.mjs --json`; `node scripts/audit_codex_pair_state.mjs --strict` |
| `scripts/record_latest_codex_session_id.mjs` | Finds the latest matching Codex JSONL session under `~/.codex/sessions` and writes `.codex-executor-session-id` or `.codex-observer-session-id`. Called by the supervisor after each role runs. | `node scripts/record_latest_codex_session_id.mjs --originator codex_exec --session-file .codex-executor-session-id --contains "ASL Pilot Codex executor"` |
| `scripts/audit_loop_premise.mjs` | Checks whether `GOAL.md` or the active prompt contradicts current repo facts, such as claiming an artifact is missing when it exists. | `node scripts/audit_loop_premise.mjs --json` |
| `scripts/brev_stop_all_training.sh` | Supporting safety helper for compute cleanup when the current mission or reviewer decision requires Brev to be default-off. | `bash scripts/brev_stop_all_training.sh` |

## Session Artifacts

The pair leaves these breadcrumbs:

- `.codex-executor-session-id` - current executor Codex session id.
- `.codex-observer-session-id` - current reviewer/observer Codex session id.
- `/tmp/asl-pilot-codex-executor-*.log` - executor turn logs.
- `/tmp/asl-pilot-codex-observer-*.log` - reviewer turn logs.
- `/tmp/asl-pilot-codex-executor-last-message.md` - latest executor answer.
- `/tmp/asl-pilot-codex-observer-last-message.md` - latest reviewer answer.
- `~/.codex/sessions/**/rollout-*.jsonl` - full Codex session transcripts.
- `docs/session-logs/NNN-*.md` - durable executor/reviewer evidence logs.
- `docs/observer-messages/observer-log.md` - durable reviewer decision trail.

Use this command to inspect the current pair state:

```sh
node scripts/audit_codex_pair_state.mjs --json
```

## Stop And Restart Rules

To durably stop future executor turns, place this sentinel at the top of
`GOAL.md` and commit it:

```text
<stop-orchestrator/>
```

When that sentinel is present, `scripts/run_codex_pair_cycle.sh` skips the
executor and runs the reviewer only. The reviewer can then STOP, REDIRECT, or
remove/replace the stopped state through a committed durable prompt change.

To find live pair processes:

```sh
ps -axo pid=,ppid=,pgid=,tty=,command= | rg 'ASL Codex|run_codex_pair_cycle|start_codex_goal_loop|codex exec'
```

Terminate only the relevant repo-local process group. Do not kill unrelated
Codex sessions.

## Health Signals

Run the audit before starting, after interrupts, and after surprising commits:

```sh
node scripts/audit_codex_pair_state.mjs
```

Warnings that require inspection include:

- missing `.codex-executor-session-id` or `.codex-observer-session-id`;
- no live supervisor or executor process when a loop is expected;
- executor session older than current `HEAD`;
- observer live while `GOAL.md` or `docs/model/*` is dirty;
- latest non-observer-looking commit co-authored by Codex Observer;
- `<stop-orchestrator/>` present while someone expects executor work to run.

Use strict mode when automation should fail on those warnings:

```sh
node scripts/audit_codex_pair_state.mjs --strict
```

## Brev / Compute Rule

Brev is off by default unless the active prompt and current user instruction
explicitly approve a bounded remote compute envelope. Before any reviewer lets
the executor spend GPU time, the repo must record the command, max runtime, max
spend, kill condition, expected signal, artifact copyback plan, cleanup rule,
and duplicate-worker check.

When STOP leaves no approved remote job queued or running, apply the default-off
policy from `docs/runbooks/codex-goal-loop.md` and
`docs/runbooks/observer-runbook-codex.md`:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
brev stop asl-pilot-rawframe-001
sleep 10
brev ls --json
```

If `brev stop` returns but `brev ls --json` still reports `RUNNING`, record the
verified stop failure as a human cost-control blocker. Do not delete or reset a
workspace without explicit user approval.

## Fast Checklist

```sh
cd /Users/kelly/Developer/asl-pilot
git status --short --branch
node scripts/audit_codex_pair_state.mjs
node scripts/audit_loop_premise.mjs --json
bash scripts/start_codex_goal_loop.sh --role supervisor --dry-run
bash scripts/start_codex_goal_loop.sh --role supervisor
```

For one local debug pass:

```sh
bash scripts/run_codex_pair_cycle.sh --once --dry-run
bash scripts/run_codex_pair_cycle.sh --once
```
