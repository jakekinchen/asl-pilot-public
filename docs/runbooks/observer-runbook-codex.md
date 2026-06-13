# Observer Runbook (Codex Side)

Exact procedure for one Codex observer pass. The active worker is a Codex executor, not Claude.

For the decision tree, read [`../observer-prompt.md`](../observer-prompt.md). For the overall protocol, read [`../autonomous-orchestrator-protocol.md`](../autonomous-orchestrator-protocol.md).

## Preconditions

- `cwd = /Users/kelly/Developer/asl-pilot`
- The Codex `observer-prompt-authoring`, `openai-api-research`, and `gpt-pro-research` skills are available.
- The repo is not mid-merge.
- The observer does not write implementation code.

## One Observer Pass

### Step 1 — Read Durable State

```sh
cd /Users/kelly/Developer/asl-pilot
git status --short
git log --oneline -10
node scripts/audit_loop_premise.mjs --json
cat GOAL.md
ACTIVE_PROMPT=$(grep -E 'Active per-milestone prompt' GOAL.md | head -1 | grep -oE '\[`[^`]+`\]' | tr -d '[`]')
cat "$ACTIVE_PROMPT"
tail -40 docs/observer-messages/observer-log.md
ls docs/session-logs/ | sort | tail -5
cat "docs/session-logs/$(ls docs/session-logs/ | sort | tail -1)" | sed -n '1,180p'
brev ls --json
```

If `audit_loop_premise.mjs` fails, prefer REDIRECT over STOP unless the human must decide.

### Step 2 — Classify Progress

Use [`../observer-prompt.md`](../observer-prompt.md):

- CONTINUE
- NUDGE
- REDIRECT
- STOP
- ESCALATE

Check the current mission exit condition in `GOAL.md`; do not judge from stale Claude-era session logs.

### Step 3 — Act

**CONTINUE**

If the current mission is still incomplete, append one entry to
`docs/observer-messages/observer-log.md`. Commit is optional unless the pass
also edits other files.

If the current mission is complete and the executor selected or created a
bounded local/no-spend next prompt, CONTINUE must also perform the durable
handoff: edit `GOAL.md` so the current mission points at that next prompt,
update the tactical overlay if needed, write a numbered handoff session log,
append the observer log, and commit those steering files. Do not leave
`GOAL.md` on the completed prompt while relying on the next executor to infer
the next prompt from observer-log prose.

**NUDGE**

Write `docs/observer-messages/NNN-nudge-<slug>.md`, append the observer log, then commit only those files.

**REDIRECT**

Edit `GOAL.md` or the active prompt, write `docs/session-logs/NNN-observer-redirect.md`, then commit only doc/prompt/log changes.

**STOP**

Set `<stop-orchestrator/>` in `GOAL.md` if the loop must halt, write `docs/session-logs/NNN-observer-stop.md`, then commit only doc/prompt/log changes.

**Idempotent halt — do not spam.** If `<stop-orchestrator/>` is ALREADY present
in `GOAL.md` and the executor evidence is unchanged since your last STOP entry in
`docs/observer-messages/observer-log.md` (same HEAD commit, same audit outputs),
the loop is already halted. Do **not** write a new session log, append the
observer log, or commit — make no change and end the pass. Only write a STOP log
and commit on the *transition* into the stopped state, never on every subsequent
parked pass. (The pair/standalone loop drivers also short-circuit on the sentinel,
but this rule binds the observer even when driven manually.)

When STOP leaves no approved remote training command queued or running, also
apply the Brev default-off policy:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
brev stop asl-pilot-rawframe-001
sleep 10
brev ls --json
```

If the stop command returns but `brev ls --json` still reports `RUNNING`, retry
with the workspace id and then `brev stop --all`. Do not delete/reset the
workspace without explicit human approval. Record the failed stop verification
in the observer log or STOP session log so the human sees the cost-control
blocker.

**ESCALATE**

Use `openai-api-research` by default or `gpt-pro-research` for deep analysis. Never echo or transmit secrets. Save artifacts under `artifacts/research/observer-NNN-*`, verify locally, then reduce to another decision and act.

## Commit Template

```text
observer: <decision> - <slug>

task: observer-<decision>
brief: docs/session-logs/NNN-observer-<decision>.md
anchors: <if any>
check: n/a

Co-Authored-By: Codex Observer <observer@codex>
```

## Monitoring

The Codex-only starter writes logs to:

- `/tmp/asl-pilot-codex-executor-*.log`
- `/tmp/asl-pilot-codex-observer-*.log`

Current session id files:

- `.codex-executor-session-id`
- `.codex-observer-session-id`

Open an observer thread manually:

```sh
codex resume --include-non-interactive "$(cat .codex-observer-session-id)"
```

## Hard Limits

The observer never:

1. writes implementation code;
2. commits implementation changes;
3. pushes to remote;
4. bypasses hooks;
5. amends commits;
6. deletes source/data/artifact paths;
7. transmits secrets;
8. launches Brev spend without explicit human approval;
9. leaves an unused Brev worker running silently after STOP.
