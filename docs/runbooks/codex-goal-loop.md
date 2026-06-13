# Codex Goal Loop Runbook

This runbook replaces the old Claude executor loop for ASL Pilot. The active pair is:

- **Codex executor**: implements one reviewable slice at a time from `GOAL.md` and the active per-milestone prompt.
- **Codex observer**: audits progress from a separate Codex session and may nudge, redirect, stop, or escalate.

The two roles coordinate through repo files and commits. They do not rely on chat memory or Claude wake hooks.

## Preconditions

```sh
cd /Users/kelly/Developer/asl-pilot
git status --short
codex doctor
```

Expected before starting:

- no uncommitted work except explicitly quarantined/recoverable evidence;
- no active Claude/Happy process for this repo;
- `GOAL.md` names a current active prompt;
- the user has chosen which Codex account/profile should spend executor tokens.
- Brev/GPU state has been checked with `brev ls --json`. If no human-approved
  remote training job is queued or actively running, Brev workspaces for this
  repo should be stopped before the pair starts.

## Start The Pair

After the desired Codex account is logged in:

```sh
cd /Users/kelly/Developer/asl-pilot
bash scripts/start_codex_goal_loop.sh --role supervisor
```

This opens one iTerm2 tab:

- `ASL Codex Pair Supervisor`: repeats one executor turn, then immediately runs one observer pass.

The supervisor is the preferred path because it preserves the handoff contract:
the observer sees the exact repo state, commits, session logs, and `/tmp`
executor log produced by the just-finished executor turn. It also prevents the
observer from drifting into a separate long-sleep loop that misses the latest
goal transition.

The supervisor resumes the Codex executor and observer sessions recorded in
`.codex-executor-session-id` and `.codex-observer-session-id` by default. Use
`ASL_PILOT_EXECUTOR_RESUME=0` or `ASL_PILOT_OBSERVER_RESUME=0` only for a
deliberate recovery pass that needs a fresh thread.

Use a dry run first when changing accounts or profiles:

```sh
bash scripts/start_codex_goal_loop.sh --role supervisor --dry-run
```

Run one foreground cycle without iTerm2:

```sh
bash scripts/run_codex_pair_cycle.sh --once
```

Inspect the pair before or after a cycle:

```sh
node scripts/audit_codex_pair_state.mjs
node scripts/audit_codex_pair_state.mjs --json
```

Legacy mode is still available for debugging:

```sh
bash scripts/start_codex_goal_loop.sh --role both
```

Only use legacy mode when you specifically want separate executor and observer
loops. Do not run legacy mode and supervisor mode at the same time.

## Executor Contract

Each executor turn must:

1. read `GOAL.md` and the active per-milestone prompt;
2. run `git status --short`;
3. run `node scripts/audit_loop_premise.mjs --json`;
4. complete exactly one smallest useful slice;
5. run the validation relevant to the slice;
6. write a numbered session log under `docs/session-logs/`;
7. commit only scoped files;
8. stop and report if the next step requires human approval, Brev spend, destructive cleanup, or a final-gate policy change.

## Brev / GPU Lifecycle

Default policy: Brev is **off unless it is actively needed** for a
human-approved remote training run. Local smokes, audits, exports, prompt
updates, and stopped-goal observer passes must not keep an A100/H100/other paid
worker running.

Before any executor or observer approves remote compute, require a compute
receipt with:

- `brev ls --json`;
- workspace name/id, instance type, GPU kind, and status;
- planned command;
- max runtime and max spend;
- kill condition;
- expected metric signal;
- explicit human approval for spend.

When `GOAL.md` has `<stop-orchestrator/>`, when a receipt selects
`stop_reduced_claim`, or when no remote command is planned, run:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
brev stop asl-pilot-rawframe-001
sleep 10
brev ls --json
```

If `brev stop` returns successfully but `brev ls --json` still reports the
workspace as `RUNNING`, try `brev stop <workspace-id>` and then `brev stop
--all`. If it still remains `RUNNING`, do **not** delete or reset the workspace
without explicit user approval; log the verified stop failure and surface it as
a human cost-control action.

### Brev start + SSH preflight race (do not burn a slice on it)

After `brev start`, the worker can report `RUNNING / READY / HEALTHY` while
`brev exec` still fails on port 22 with repeated `waiting for SSH connection to
be available` and exits `124`. This is a **transient race**, not a dead worker:
`sshd` is not up yet and the worker's public IP can rotate during boot. Treating
the first timeout as a hard blocker — and tearing the worker down — wastes a
whole slice and has repeatedly degraded the worker to `UNHEALTHY` (e.g. M3JB
sessions 912, 927).

Do **not** record a preflight blocker or stop the worker on the first SSH
timeout. Instead, retry within the same slice, refreshing state between attempts
so a rotated IP is picked up. Use a shorter per-attempt timeout so the retries
fit the slice budget:

```sh
ok=0
for attempt in 1 2 3 4 5; do
  brev ls --json >/dev/null 2>&1            # refresh cached connection / rotated IP
  brev refresh >/dev/null 2>&1 || true      # if available in this brev build
  if timeout 90 brev exec asl-pilot-m3eh-l40s-001 "true" >/dev/null 2>&1; then
    ok=1; break
  fi
  sleep 25
done
[ "$ok" = 1 ] && timeout 120 brev exec asl-pilot-m3eh-l40s-001 "nvidia-smi -L && python -c 'import torch;print(torch.cuda.is_available())'"
```

Only after these retries are exhausted on a worker that is still
`RUNNING / */  HEALTHY` should you record a preflight blocker and stop the
worker. A single healthy-worker SSH race must converge inside one slice, not
across a blocker → health-refresh → retry chain of slices.

Remote training prompts must include a teardown step that stops the worker and
verifies the stopped state after artifacts are copied back or explicitly
preserved.

## Observer Contract

The observer follows [`observer-runbook-codex.md`](observer-runbook-codex.md), but now observes a Codex executor rather than a Claude orchestrator. It never writes implementation code. Legal actions are:

- append a CONTINUE entry to `docs/observer-messages/observer-log.md`;
- author a nudge file;
- edit `GOAL.md` or the active per-milestone prompt;
- write an observer session log;
- commit doc/prompt changes only.

## Stop The Pair

Find the iTerm2 tab and interrupt it, or terminate repo-local Codex pair loops:

```sh
ps -axo pid=,ppid=,pgid=,tty=,command= | rg 'ASL Codex|run_codex_pair_cycle|start_codex_goal_loop|codex exec'
```

Then send `TERM` to the relevant process group. Do not kill unrelated Codex sessions.

To stop future executor turns durably, place `<stop-orchestrator/>` at the top of `GOAL.md` and commit it.

## Health Rules

Treat these as repair signals:

- `.codex-executor-session-id` points to a session older than `HEAD`;
- the latest implementation or goal-redirect commit was made from the observer session;
- `GOAL.md` or `docs/model/*` is dirty while an observer TUI is still open;
- no supervisor process is live and no executor turn has run since the last goal edit;
- `/tmp/asl-pilot-codex-executor-last-message.md` is older than the latest session log.

Use `node scripts/audit_codex_pair_state.mjs --strict` when you want those
signals to fail automation.

## Current Mission Bias

Current files beat this runbook. As of the M3AE-AP STOP, no autonomous model
objective is selected while `GOAL.md` has `<stop-orchestrator/>`; the next
executor must stay parked until the user explicitly chooses a reduced claim,
new data/source milestone, focused research pass, or another scope. Do not
continue broad Internet Archive, handclap, rawframe, Detector 0, Brev training,
or crop-normalization work unless `GOAL.md` is explicitly redirected.
