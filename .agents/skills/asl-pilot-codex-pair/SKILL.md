---
name: asl-pilot-codex-pair
description: Use when operating, repairing, or optimizing the ASL Pilot Codex executor and observer goal-loop pair in /Users/kelly/Developer/asl-pilot.
---

# ASL Pilot Codex Pair Skill

Use this skill for ASL Pilot loop-control work: finding the current executor and
observer sessions, starting the pair, checking whether the pair is healthy, or
repairing role drift.

## Source Of Truth

Read in this order:

1. `/Users/kelly/Developer/asl-pilot/GOAL.md`
2. The active per-milestone prompt named in `GOAL.md`
3. `docs/runbooks/codex-goal-loop.md`
4. `docs/runbooks/observer-runbook-codex.md`
5. `docs/observer-prompt.md`
6. Latest numbered file under `docs/session-logs/`
7. `docs/observer-messages/observer-log.md`
8. `git log --oneline -10` and `git status --short`
9. `.codex-executor-session-id`, `.codex-observer-session-id`, and matching
   `~/.codex/sessions/**/rollout-*.jsonl`

Current files beat old session logs. Latest user instruction beats all repo
docs.

## Quick Commands

```sh
cd /Users/kelly/Developer/asl-pilot
node scripts/audit_codex_pair_state.mjs
bash scripts/start_codex_goal_loop.sh --role supervisor --dry-run
bash scripts/start_codex_goal_loop.sh --role supervisor
```

For a foreground one-shot cycle:

```sh
bash scripts/run_codex_pair_cycle.sh --once
```

## Operating Model

Prefer the supervised pair loop. It runs:

1. one Codex executor turn;
2. one Codex observer pass immediately after that turn;
3. a pair-state audit before and after the cycle;
4. repeat only when started with `--loop`.

Do not run the old independent two-tab executor/observer loop at the same time
as the supervisor. The old mode can leave the observer sleeping while the
executor advances, or let a manually resumed observer become the accidental
executor.

## Repair Signals

Pause and inspect before starting another cycle when:

- `node scripts/audit_codex_pair_state.mjs` reports warnings;
- the executor session is older than `HEAD`;
- the observer session made the latest implementation or redirect commit;
- `GOAL.md` or `docs/model/*` is dirty while an observer TUI is still active;
- there are multiple repo-local Codex processes not controlled by the
  supervisor;
- the active prompt contradicts the latest user instruction.
- repeated learnability/model-input slices fail after data/tensor audits pass
  and no current `artifacts/research/observer-*` API/GPT strategy memo exists.
  In that case, steer the observer to ESCALATE before approving another
  training-style slice.

## Role Boundaries

Executor:

- implements one smallest useful slice;
- validates it;
- writes a numbered session log;
- commits scoped implementation or evidence files.

Observer:

- reads the latest executor evidence;
- chooses exactly CONTINUE, NUDGE, REDIRECT, STOP, or ESCALATE;
- checks whether the approach is actually progressing, and requires
  `openai-api-research` or `gpt-pro-research` before further training-style
  retries after repeated audited learning failures;
- may edit `GOAL.md` or prompt docs only for steering;
- does not write implementation code or take over executor work.

## Evidence Standard

When reporting state, include:

- executor and observer session ids;
- live process status;
- active prompt path;
- latest commit and whether it came from executor or observer;
- dirty worktree files;
- latest `/tmp/asl-pilot-codex-executor-*.log` and observer log paths;
- exact blocker or next action.
