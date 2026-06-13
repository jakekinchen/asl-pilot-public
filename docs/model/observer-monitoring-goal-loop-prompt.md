# Observer Monitoring Goal Loop Prompt

Interim mission 3d of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first.

## Mission

Close a real ergonomic gap surfaced during the M3a → M3b → M3c → STOP cycle: the Codex observer runs as a non-interactive `codex exec` process spawned by [`.claude/hooks/on-orchestrator-stop.sh`](../../.claude/hooks/on-orchestrator-stop.sh). Its output streams to a per-pass log at `/tmp/codex-observer-wake-<iso>.log` but is invisible in the Codex GUI session list. A human operator has no convenient way to watch the observer reason in real time.

This mission adds `scripts/watch_observer.sh` (auto-rotating tail of the newest observer log) and documents both that helper and the post-pass interactive `codex resume --last` path in the observer runbook.

## Source Of Truth

1. User's latest explicit instructions.
2. [`GOAL.md`](../../GOAL.md) operating contract.
3. [`.claude/hooks/on-orchestrator-stop.sh`](../../.claude/hooks/on-orchestrator-stop.sh) — confirms the per-pass log path pattern.
4. [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md) — destination for the new "Monitoring the observer" section.
5. `codex resume --help` — for the interactive resume path.

## Acceptance Criteria

All three must be true:

1. **`scripts/watch_observer.sh` exists**, is `chmod +x`, passes `bash -n`, follows the newest `/tmp/codex-observer-wake-*.log`, strips ANSI by default (with `--no-strip-ansi` opt-out), and rotates when a newer log appears.
2. **[`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md)** has a new "Monitoring the observer" section that documents (a) `bash scripts/watch_observer.sh` for live streaming and (b) `codex resume --last` for interactive thread inspection after a pass finishes.
3. **No regression**: `node scripts/audit_no_pretrained_deps.mjs`, `node scripts/audit_no_pretrained_artifact_json.mjs`, `node scripts/audit_no_raw_video_upload.mjs` all pass.

## Observer Redirect 020 (2026-05-24)

Codex observer verified `d188336` after the close signal and found acceptance criterion 1 is **not yet met**. `bash -n scripts/watch_observer.sh`, the runbook docs check, `codex resume --help`, and the three no-regression audits all passed, but an isolated `/tmp` rotation smoke failed twice:

- The helper detected the first synthetic log, printed `=== watch_observer: streaming codex-observer-wake-2026-05-24T03-20-00Z.log ===`, and stripped ANSI from `first-line`.
- After a newer matching log was created and appended with `second-line`, the helper never printed the newer log header and never emitted `second-line`.

Repair the watcher so it can rotate from one matching observer log to a newer one while the previous `tail` pipeline is active. Do not close mission 3d again until a retained or session-log-recorded rotation smoke proves first-log output, newer-log detection, ANSI stripping by default, and clean shutdown. A likely area to inspect is the background `tail | sed` pipeline lifecycle (`$!`, `kill`, and `wait` behavior), but verify the root cause from the script rather than treating that as fact.

## Forbidden Tactics

- No first-party collection, Brev work, training, or model-card promotion.
- No new dependencies.
- No edits to the orchestrator-stop hook itself.
- No changes to source files under `web/src/`.

## Handoff

When the three criteria are met, transition to awaiting-observer with reason `exit-condition-met` and observer_focus `roll-mission-forward`. The Codex pass that fires will both verify the docs change AND incidentally exercise the new `scripts/watch_observer.sh` (the human can tail it during the pass).

## History

- 2026-05-24 — Observer redirect after `d188336`: the script passed `bash -n`, was executable, and the runbook docs/no-regression trio were green, but a synthetic rotation probe showed it starts on the first log, detects a newer matching log, then stalls at `wait "$tail_pid"` instead of streaming the second log. Do not close this mission again until a retained session log records a passing synthetic rotation proof that includes a line from the newer log.
