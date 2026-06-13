# Docs Lessons

Stable numeric lesson ids. Never reorder or reuse ids.

## template

```md
# 1. <lesson title>

date: YYYY-MM-DD
source slice: <brief/session>
source task: `MVP_TASKS.md#task-XXX`
anchors:
- `ARCHITECTURE.md#arch-...`

## context

## gotcha / pattern

## rule

## examples

## linked files
```

# 1. Keep Brev handoffs executable before approval

date: 2026-05-25
source slice: docs/session-logs/131-brev-handoff-runbook.md
source task: `MVP_TASKS.md#task-006`
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-training-pipeline`
- `ARCHITECTURE.md#arch-storage-policy`

## context

Mission 3R reached a clean local pre-Brev state, but paid provisioning still requires explicit human approval.

## gotcha / pattern

A repo sync that excludes all of `data/` is good storage hygiene, but final rawframe training with `--check-files` also needs the manifest, tensor, and raw PopSign video paths on the worker.

## rule

Before asking for Brev approval, keep the create, sync, remote train, copy-back, and stop commands in one operator-facing handoff with the exact training-data allowlist and output artifact paths.

## examples

- `docs/runbooks/brev-rawframe-training-handoff.md`
- `scripts/brev_sync_repo.sh`

## linked files

- `docs/runbooks/brev-rawframe-training-handoff.md`
- `scripts/brev_create_48h.sh`
- `scripts/brev_sync_repo.sh`
- `scripts/brev_stop_all_training.sh`

# 2. Keep first-screen status aligned with GOAL

date: 2026-05-25
source slice: docs/session-logs/132-readme-mission-3r-state.md
source task: `MVP_TASKS.md#task-006`
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-active-module`
- `ARCHITECTURE.md#arch-data-provenance`

## context

Mission 3R re-centered the loop on the 95-label PopSign-v1 training path, but the README still described first-party clip collection as the active Mission 3 blocker.

## gotcha / pattern

After a mission redirect, top-level handoff docs can keep repeating the old blocker even when `GOAL.md` and the active prompt are correct.

## rule

When `GOAL.md` changes the active blocker, update the first-screen README status so reviewers see the same blocker classification as the current mission files.

## examples

- `README.md`
- `GOAL.md`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`

## linked files

- `README.md`
- `docs/runbooks/brev-rawframe-training-handoff.md`

# 3. Split future first-party lanes from current approved-source blockers

date: 2026-05-25
source slice: docs/session-logs/133-mvp-tasks-popsign-blocker-alignment.md
source task: `MVP_TASKS.md#task-007`, `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-data-provenance`
- `ARCHITECTURE.md#arch-first-party-data`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3R uses approved PopSign-v1 raw videos for the active first training pass, while first-party collection remains a valid future lane.

## gotcha / pattern

Task ledgers can preserve old "first-party prerequisite" wording even after `GOAL.md` and the active prompt have separated the current approved-source training path from future first-party collection.

## rule

When an external source is explicitly cleared for model training, label first-party collection as a future data lane unless the current mission files make it the active blocker again.

## examples

- `MVP_TASKS.md#task-007`
- `MVP_TASKS.md#task-010`

## linked files

- `MVP_TASKS.md`
- `docs/model/dataset-source-register.json`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`

# 4. Keep the start-here handoff on the active human gate

date: 2026-05-25
source slice: docs/session-logs/134-resume-mission-3r-handoff.md
source task: `MVP_TASKS.md#task-006`
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-active-module`
- `ARCHITECTURE.md#arch-data-provenance`

## context

The README points operators to `docs/handoff/RESUME.md` first, but that handoff still described first-party collection and Claude loop resume steps after Mission 3R had moved to Codex and PopSign/Brev readiness.

## gotcha / pattern

It is not enough to align `GOAL.md`, README, and `MVP_TASKS.md`; the operator's start-here handoff can still preserve the old human gate and send the next person down the wrong path.

## rule

When the active human gate changes, update the start-here handoff to name the current gate, the current loop runtime, and any old gate as future/historical.

## examples

- `docs/handoff/RESUME.md`
- `docs/runbooks/brev-rawframe-training-handoff.md`

## linked files

- `docs/handoff/RESUME.md`
- `docs/runbooks/codex-goal-loop.md`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`

# 5. Retire executable legacy loop runbooks

date: 2026-05-25
source slice: docs/session-logs/135-retire-claude-rollover-runbook.md
source task: `MVP_TASKS.md#task-006`
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-active-module`

## context

Mission 3R moved ASL Pilot from a Claude/Happy executor to Codex executor + Codex observer, but a legacy Claude rollover runbook still contained executable start commands.

## gotcha / pattern

An obsolete runbook can stay dangerous even after every current handoff says Codex, because operators search by task symptom such as "rollover" and follow the old command block.

## rule

When retiring a runtime path, remove executable legacy commands from operator runbooks and leave only a clear historical note plus the current replacement command.

## examples

- `docs/runbooks/claude-thread-rollover.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `docs/runbooks/claude-thread-rollover.md`
- `docs/runbooks/codex-goal-loop.md`
- `scripts/start_codex_goal_loop.sh`

# 6. Align message channels with runtime changes

date: 2026-05-25
source slice: docs/session-logs/136-align-observer-message-channel.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved the autonomous pair to Codex executor + Codex observer, but the observer message channel still described a Claude orchestrator and `/loop-tick` as the active reader.

## gotcha / pattern

Message-channel docs are operational surfaces too. If they keep old runtime names, future operators can misread historical log entries as instructions for the current loop.

## rule

When the loop runtime changes, update both the channel README and active log header so they name the current writer, reader, acknowledgement protocol, and cadence.

## examples

- `docs/observer-messages/README.md`
- `docs/observer-messages/observer-log.md`

## linked files

- `docs/observer-prompt.md`
- `docs/autonomous-orchestrator-protocol.md`

# 7. Mirror Brev redirects into the active prompt before spending

date: 2026-06-03
source slice: docs/session-logs/911-mission-3jb-recognizer-transformer-prompt-alignment.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`

## context

`GOAL.md` redirected M3JB from the landmark-PCK campaign to a recognizer
Transformer distill campaign with new Brev approval, but the active prompt still
described the old landmark run4 envelope.

## gotcha / pattern

The executor freshness guard follows `GOAL.md`, but the Brev-spend guard needs
both `GOAL.md` and the active prompt to record current approval. If only
`GOAL.md` changes, new remote work should pause for prompt alignment.

## rule

After a Brev-related mission redirect, first mirror the active directive,
approval envelope, stop conditions, and next slice into the active prompt; stop
or verify stopped any superseded worker process before starting the new paid
campaign.

## examples

- `docs/validation/return-to-form-m3jb-recognizer-transformer-prompt-alignment-v1.json`

## linked files

- `GOAL.md`
- `docs/model/return-to-form-m3jb-hierarchical-hand-state-tracker-goal-loop-prompt.md`
- `docs/runbooks/codex-goal-loop.md`

# 7. Keep the active goal header runtime-specific

date: 2026-05-25
source slice: docs/session-logs/137-align-goal-header-codex-loop.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R had already moved the active worker to Codex executor, but the top of `GOAL.md` still described the file as something an always-on orchestrator re-read.

## gotcha / pattern

Even when the current mission block is correct, generic header wording can preserve an obsolete mental model for the loop runtime.

## rule

Keep the active goal header explicit about the current reader and cadence, and leave historical mission sections untouched unless they are themselves current instructions.

## examples

- `GOAL.md`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`

## linked files

- `docs/runbooks/codex-goal-loop.md`
- `docs/autonomous-orchestrator-protocol.md`
- `scripts/start_codex_goal_loop.sh`

# 8. Keep repo-layout comments operationally current

date: 2026-05-25
source slice: docs/session-logs/138-align-readme-layout-codex-loop.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

After the Codex takeover, the README repo-layout tree still described `GOAL.md` as an autonomous-loop iteration prompt and `.claude/` as orchestrator commands.

## gotcha / pattern

Repo-layout comments are often skimmed before deeper runbooks. If they keep old runtime labels, they can conflict with the active GOAL and Codex runbook even when the rest of the README is current.

## rule

When loop ownership changes, update top-level layout comments for `GOAL.md`, legacy runtime folders, and active runbooks in the same pass.

## examples

- `README.md`
- `GOAL.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `README.md`
- `docs/handoff/RESUME.md`
- `scripts/start_codex_goal_loop.sh`

# 9. Keep status gates on current session files

date: 2026-05-25
source slice: docs/session-logs/139-align-stage-gate-codex-loop.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R replaced the Claude loop with Codex executor + Codex observer, but `STAGE_GATE_STATUS.md` still pointed at `.orchestrator-session-id`, slash-command scheduling, and the old observer-log path.

## gotcha / pattern

Status gate checklists are operational docs. If they name old session files, a later operator can try to verify the wrong runtime even when GOAL and runbooks are current.

## rule

When loop ownership changes, update status gates to name the current session-id files, start command, and observer-log path, while leaving historical close-out facts intact.

## examples

- `STAGE_GATE_STATUS.md`
- `scripts/start_codex_goal_loop.sh`
- `docs/observer-messages/observer-log.md`

## linked files

- `docs/runbooks/codex-goal-loop.md`
- `docs/runbooks/observer-runbook-codex.md`
- `GOAL.md`

# 10. Retire executable legacy launch helpers with guards

date: 2026-05-25
source slice: docs/session-logs/140-retire-claude-loop-helper.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R retired the Claude/Happy executor loop, but `scripts/start_claude_loop.sh` could still open a legacy Claude TUI path if an operator ran it directly.

## gotcha / pattern

Retiring a runbook is not enough when an executable helper remains in the repo. Operators may jump straight to scripts by name.

## rule

When a runtime path is retired, make its launcher fail closed before any cleanup or launch side effects, and point to the current replacement command.

## examples

- `scripts/start_claude_loop.sh`
- `scripts/start_codex_goal_loop.sh`
- `docs/runbooks/claude-thread-rollover.md`

## linked files

- `docs/runbooks/codex-goal-loop.md`
- `GOAL.md`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`

# 11. Put a retirement guard in legacy agent entrypoints

date: 2026-05-25
source slice: docs/session-logs/141-align-root-claude-entrypoint.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Root `CLAUDE.md` still described Claude as the active orchestrator and gave live `/loop /loop-tick` start instructions after Mission 3R had moved to Codex.

## gotcha / pattern

Agent-specific entrypoint files are executable in practice because new sessions read them first. A stale entrypoint can override newer runbooks by telling the wrong runtime how to start.

## rule

When retiring an agent runtime, add a top-level retirement notice to that runtime's entrypoint and replace live start instructions with the current runner.

## examples

- `CLAUDE.md`
- `docs/runbooks/codex-goal-loop.md`
- `scripts/start_codex_goal_loop.sh`

## linked files

- `GOAL.md`
- `docs/autonomous-orchestrator-protocol.md`
- `docs/observer-prompt.md`

# 12. Keep historical handoffs from selecting current work

date: 2026-05-25
source slice: docs/session-logs/142-align-claude-code-handoff.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R had moved the active worker to Codex executor + Codex observer, but `CLAUDE_CODE_HANDOFF.md` still contained live Claude-loop start and task-selection instructions.

## gotcha / pattern

Historical handoffs can outlive the runtime they were written for. If they still contain executable startup commands or "first job" task picks, they can quietly override current `GOAL.md` guidance during a handoff.

## rule

When a runtime handoff is retained for history, mark it as historical at the top and replace live startup/task-selection instructions with pointers to the active goal loop.

## examples

- `CLAUDE_CODE_HANDOFF.md`
- `docs/runbooks/codex-goal-loop.md`
- `scripts/start_codex_goal_loop.sh`

## linked files

- `GOAL.md`
- `CLAUDE.md`
- `docs/observer-messages/README.md`

# 13. Retire slash-command entrypoints at the command file

date: 2026-05-25
source slice: docs/session-logs/143-retire-loop-tick-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R retired the Claude/Happy executor loop, but the `.claude/commands/loop-tick.md` command file still contained the old always-on loop procedure.

## gotcha / pattern

Leaving the old command body in place is riskier than leaving a historical doc alone, because slash-command files are executable instructions for the retired runtime.

## rule

When a slash-command runtime is retired, replace the command body with a fail-closed notice and the current replacement command instead of merely adding historical labels around the old procedure.

## examples

- `.claude/commands/loop-tick.md`
- `scripts/start_codex_goal_loop.sh`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/autonomous-orchestrator-protocol.md`
- `docs/session-logs/126-codex-loop-takeover.md`

# 14. Close task-selection commands when the runtime changes

date: 2026-05-25
source slice: docs/session-logs/144-retire-orchestrate-start-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

After `/loop-tick` was retired, `.claude/commands/orchestrate-start.md` still selected tasks, authored briefs, and wrote the old orchestrator session file for the retired Claude runtime.

## gotcha / pattern

Runtime retirement needs to cover both the tick command and the task-selection command. Otherwise a future operator can skip the retired tick but still invoke the old task picker.

## rule

When replacing a loop runtime, close every slash-command entrypoint that can select work, mutate task state, or create session-control files for the old runtime.

## examples

- `.claude/commands/orchestrate-start.md`
- `.claude/commands/loop-tick.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `scripts/start_codex_goal_loop.sh`
- `docs/session-logs/126-codex-loop-takeover.md`

# 15. Close slash-command commit paths after takeover

date: 2026-05-25
source slice: docs/session-logs/145-retire-orchestrate-end-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R had retired the Claude loop, but `.claude/commands/orchestrate-end.md` still contained a live closeout path with task-state mutation and Claude commit-trailer instructions.

## gotcha / pattern

Retiring startup commands is not enough if the old closeout command can still stage, commit, route flags, or advance task state under the retired runtime.

## rule

When replacing a loop runtime, close both startup and closeout command files so every commit path points at the active executor contract.

## examples

- `.claude/commands/orchestrate-end.md`
- `.claude/commands/orchestrate-start.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/autonomous-orchestrator-protocol.md`
- `scripts/start_codex_goal_loop.sh`

# 16. Move goal redirects out of retired command sets

date: 2026-05-25
source slice: docs/session-logs/146-retire-goal-update-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved redirect authority to Codex observer decisions and Codex executor exit handling, but `.claude/commands/goal-update.md` still contained a live GOAL-edit and commit procedure.

## gotcha / pattern

A retired runtime can still change the active mission if its goal-update command remains executable-looking, even after startup and closeout commands are closed.

## rule

When replacing a loop runtime, close old goal-redirection command files and point mission changes to the current observer/executor runbooks.

## examples

- `.claude/commands/goal-update.md`
- `docs/observer-prompt.md`
- `docs/runbooks/observer-runbook-codex.md`

## linked files

- `GOAL.md`
- `docs/runbooks/codex-goal-loop.md`
- `scripts/start_codex_goal_loop.sh`

# 17. Close retired brief-writing commands

date: 2026-05-25
source slice: docs/session-logs/147-retire-write-brief-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved slice selection to Codex executor turns, but `.claude/commands/write-brief.md` still created planning briefs and mutated task state from the retired Claude command set.

## gotcha / pattern

Old brief-writing helpers can quietly restart a stale task-ledger workflow even when loop startup, closeout, and goal-update commands have already been closed.

## rule

When replacing a loop runtime, close old brief-writing command files and point scoping work to the active goal prompt and runbook.

## examples

- `.claude/commands/write-brief.md`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `scripts/start_codex_goal_loop.sh`

# 18. Close retired session bootstrap commands

date: 2026-05-25
source slice: docs/session-logs/148-retire-session-start-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved session start and slice selection into the Codex executor runbook, but `.claude/commands/session-start.md` still looked like a live Claude-session bootstrap and delegated into `/tdd`.

## gotcha / pattern

A retired runtime can restart through a small bootstrap command even after the larger loop, brief-writing, goal-update, and closeout commands have been closed.

## rule

When replacing a loop runtime, close old session bootstrap commands and point their read order to the active goal prompt plus runbook.

## examples

- `.claude/commands/session-start.md`
- `.claude/commands/tdd.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `scripts/start_codex_goal_loop.sh`

# 19. Close retired test-loop commands

date: 2026-05-25
source slice: docs/session-logs/149-retire-tdd-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved execution into the Codex executor runbook, but `.claude/commands/tdd.md` still contained a live Claude-era implementation loop with checkpoint, validation, commit, and flag-routing steps.

## gotcha / pattern

After startup and session bootstrap commands are closed, a retired test-loop command can still recreate the old execution path from inside a Claude slash-command flow.

## rule

When replacing a loop runtime, close old test-loop command files and point implementation work to the active executor contract instead of preserving legacy step lists.

## examples

- `.claude/commands/tdd.md`
- `.claude/commands/session-start.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `scripts/start_codex_goal_loop.sh`

# 20. Close retired team bootstrap commands

date: 2026-05-25
source slice: docs/session-logs/150-retire-team-start-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved active execution into the Codex executor/observer pair, but `.claude/commands/team-start.md` still bootstrapped a Claude-era team with orchestrator and implementer roles before the retired task-selection path.

## gotcha / pattern

A retired team bootstrap can recreate the old runtime one level above the usual startup command by assigning roles and choosing an orchestrator target.

## rule

When replacing a loop runtime, close old team-bootstrap command files and point operator startup to the active executor/observer runbook.

## examples

- `.claude/commands/team-start.md`
- `.claude/commands/orchestrate-start.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `scripts/start_codex_goal_loop.sh`

# 21. Close retired session closeout commands

date: 2026-05-25
source slice: docs/session-logs/151-retire-session-end-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved closeout into the Codex executor contract, but `.claude/commands/session-end.md` still referenced retired slash-command proof, step flags, and dated old-format session-log names.

## gotcha / pattern

After startup and implementation commands are closed, a stale session closeout command can still restore retired validation and logging expectations.

## rule

When replacing a loop runtime, close old session-closeout command files and point closeout to the active executor runbook and current numbered log convention.

## examples

- `.claude/commands/session-end.md`
- `.claude/commands/orchestrate-end.md`
- `docs/runbooks/codex-goal-loop.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `scripts/start_codex_goal_loop.sh`

# 22. Close retired observer fallback commands

date: 2026-05-25
source slice: docs/session-logs/152-retire-observer-check-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R made Codex observer the canonical observer, but `.claude/commands/observer-check.md` still allowed a Claude-side emergency observer pass with observer-message writes, goal redirects, and a Claude fallback commit trailer.

## gotcha / pattern

A retired observer fallback can keep old runtime authority alive even after executor startup and closeout commands are closed.

## rule

When replacing a loop runtime, close fallback observer command files and route observer decisions only through the active observer runbook and prompt.

## examples

- `.claude/commands/observer-check.md`
- `docs/runbooks/observer-runbook-codex.md`
- `docs/observer-prompt.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `scripts/start_codex_goal_loop.sh`

# 23. Close retired flag-routing commands

date: 2026-05-25
source slice: docs/session-logs/153-retire-route-flags-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved blocker classification into Codex executor logs and redirects into the Codex observer path, but `.claude/commands/route-flags.md` still routed old step-9 flags into `MVP_TASKS.md`, active briefs, area lessons, `DECISIONS.md`, and validation artifacts.

## gotcha / pattern

A retired flag router can mutate the old task graph and decision surfaces even after startup, execution, closeout, and observer commands are closed.

## rule

When replacing a loop runtime, close old flag-routing command files and route blockers through the active executor log format plus observer runbook.

## examples

- `.claude/commands/route-flags.md`
- `docs/runbooks/codex-goal-loop.md`
- `docs/runbooks/observer-runbook-codex.md`

## linked files

- `GOAL.md`
- `docs/observer-messages/observer-log.md`
- `docs/session-logs/`

# 24. Close retired reachability-check commands

date: 2026-05-25
source slice: docs/session-logs/154-retire-wired-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved evidence recording into Codex executor session logs, but `.claude/commands/wired.md` still described a Claude-side reachability check with Brev shell/script invocation as a valid entry point.

## gotcha / pattern

A retired reachability command can accidentally turn a documentation check into runtime action, especially when it lists paid Brev invocation beside local smoke checks.

## rule

When replacing a loop runtime, close old reachability command files and record reachability evidence through direct commands plus the active executor log.

## examples

- `.claude/commands/wired.md`
- `docs/runbooks/codex-goal-loop.md`
- `docs/runbooks/brev-rawframe-training-handoff.md`

## linked files

- `GOAL.md`
- `docs/session-logs/`
- `scripts/start_codex_goal_loop.sh`

# 25. Close retired test-runner commands

date: 2026-05-25
source slice: docs/session-logs/155-retire-run-tests-command.md
source task: `MVP_TASKS.md#task-025`
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

Mission 3R moved validation selection into the Codex executor runbook and active prompt, but `.claude/commands/run-tests.md` still let a Claude slash command choose test scope, run broader suites, and record results from an active brief.

## gotcha / pattern

A retired test-runner command can silently reintroduce old active-brief assumptions and broad suite selection after the executor loop has moved to a smaller slice contract.

## rule

When replacing a loop runtime, close old test-runner command files and run validation directly from the active prompt, touched files, and existing repo audits.

## examples

- `.claude/commands/run-tests.md`
- `docs/runbooks/codex-goal-loop.md`
- `docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`

## linked files

- `GOAL.md`
- `docs/session-logs/`
- `scripts/audit_loop_premise.mjs`

# 26. Bind small-proof selection before decode

date: 2026-05-25
source slice: docs/session-logs/183-return-to-form-tier0-selection.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-data-provenance`
- `ARCHITECTURE.md#arch-crop-pipeline`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AC returned the model path from broad 75/95-label retries to a 5-sign
Tier 0 fixed-crop proof.

## gotcha / pattern

Existing reduced-label manifests can prove source coverage, but they should not
silently become the training contract if they lack the current crop-config hash.

## rule

Before decode or training, write the selected labels, source coverage, crop
protocol, and gates as separate artifacts, then make the next slice bind those
hashes into refreshed manifests/tensors.

## examples

- `docs/research/return-to-form-tier0-source-coverage.json`
- `docs/model/return-to-form-fixed-crop-config.json`
- `docs/validation/return-to-form-tier0-gates.json`

## linked files

- `docs/model/return-to-form-plan.md`
- `data/manifests/diagnostics/popsign-label-ladder/005-labels/`

# 27. Separate two-box collapse from L/R assignment gates

date: 2026-06-02
source slice: docs/session-logs/855-mission-3jb-heuristic-top2nms-baseline.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB redirected away from more selector training and toward a local
top-2 objectness + NMS baseline plus deterministic post-filters.

## gotcha / pattern

The same detector receipt can prove two distinct non-collapsed boxes while
failing the stricter distinct L/R assignment metric. In the M3JB baseline,
`decoded_two_distinct=1.0` and `collapse_rate=0.0`, but
`distinct_assigned_coverage=0.428571`.

## rule

Receipts must report the two-box/collapse proxy separately from distinct L/R
assignment, then state whether the recognizer actually requires L/R identity.
Do not answer a product-scope gate mismatch with another training run.

## examples

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 35. Prove targeted relabel source availability before running relabel work

date: 2026-06-02
source slice: docs/session-logs/863-mission-3jb-targeted-relabel-queue.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had a fixed edge/OOB crop backlog where simple crop-context
expansion had already shown a low ceiling.

## gotcha / pattern

"Run targeted relabel" is still too vague if the receipt does not prove which
rows are true frame-edge cases, whether their original source videos are
present, and whether a bounded prefix will actually exercise the target
failure mode.

## rule

Before running an offline teacher relabel job, record the target queue with raw
source availability, prefix purity, and the exact bounded command. Keep it
local/no-Brev until the smoke proves recovered labels are worth rebuilding into
a larger cache or training run.

## examples

- `current_state.landmark_targeted_relabel_queue`
- `gates.landmarks.metrics.targeted_relabel_train_frame_edge_candidates`
- `gates.landmarks.metrics.targeted_relabel_train_top32_frame_edge`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 36. Treat targeted relabel smoke as recovery evidence, not just detection evidence

date: 2026-06-02
source slice: docs/session-logs/864-mission-3jb-targeted-relabel-smoke.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB ran a bounded top-32 train/test targeted relabel smoke for true
frame-edge/OOB landmark candidates after proving source videos were available.

## gotcha / pattern

Side-worktree relabel scripts may rely on manifest paths relative to the side
worktree root, not the tool directory. Once the source path is correct, a high
selected-hand detection rate can still produce very few accepted labels if
visible-fraction and OOB filters reject the detections.

## rule

Record processed, selected-detected, written, and rejection counts separately.
Do not rebuild a landmark cache from a targeted relabel smoke unless the strict
write yield is high enough to matter; route low-yield smokes to acceptance,
clearer-source, or true-frame-edge exclusion policy review.

## examples

- `current_state.landmark_targeted_relabel_smoke`
- `gates.landmarks.metrics.targeted_relabel_train_top32_written`
- `gates.landmarks.metrics.targeted_relabel_test_top32_strict_write_rate`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 37. Use selected-only relabel output to inspect quality before relaxing thresholds

date: 2026-06-02
source slice: docs/session-logs/865-mission-3jb-targeted-relabel-acceptance-diagnostic.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB strict top-32 targeted relabel smoke recovered almost no accepted
labels, even though selected-hand detections were common.

## gotcha / pattern

If selected-only output has low visible fractions and many OOB landmarks,
threshold relaxation can convert bad frame-edge labels into training data.
In the top-32 diagnostic, train selected-only wrote `22/32` but only one row
passed visible `>=0.50` with `<=4` OOB points, while diagnostic test wrote
`30/32` and zero rows passed that moderate threshold.

## rule

Use selected-only relabel output as a diagnostic distribution probe first.
Require visibility/OOB threshold counts before treating selected-only rows as
cache-rebuild candidates; otherwise route to true-frame-edge exclusion or
clearer-source policy review.

## examples

- `current_state.landmark_targeted_relabel_acceptance_diagnostic`
- `gates.landmarks.metrics.targeted_relabel_train_top32_selectedonly_visible050_oob_lte4`
- `gates.landmarks.metrics.targeted_relabel_test_top32_selectedonly_visible_max`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 38. Quarantine frame-edge selected-only labels before cache rebuild

date: 2026-06-02
source slice: docs/session-logs/866-mission-3jb-frame-edge-cache-policy.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB needed to turn selected-only relabel diagnostics into an explicit
cache policy before any landmark cache rebuild or longer heatmap training.

## gotcha / pattern

Selected-only teacher detections are useful source-availability evidence, but
they are not automatically training-label evidence. In the top-32 frame-edge
probe, `0/52` selected-only rows were cache-rebuild eligible after requiring
visible fraction `>=0.50`, OOB points `<=4`, selected-center distance `<=0.35`,
and requested-hand-key match. `51/52` rows remained severe frame-edge/OOB
exclusions.

## rule

Do not rebuild a landmark cache from selected-only true-frame-edge/OOB rows.
Quarantine those rows unless they pass the full cache policy or a
clearer-source/exclusion manifest records why the row is safe or intentionally
removed.

## examples

- `current_state.landmark_frame_edge_cache_policy_decision`
- `gates.landmarks.metrics.frame_edge_policy_cache_eligible_moderate_rows`
- `gates.landmarks.metrics.frame_edge_policy_severe_frame_edge_oob_exclusion_rows`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 39. Materialize exclusion manifests before rebuilding landmark caches

date: 2026-06-02
source slice: docs/session-logs/867-mission-3jb-frame-edge-disposition-manifest.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB needed a reviewable artifact between cache policy and any landmark
cache rebuild. The selected-only frame-edge rows were known unsafe, but the next
executor needed row-level disposition data rather than only aggregate counts.

## gotcha / pattern

A policy summary can block unsafe cache rebuilds, but it is not enough to drive
review. The full disposition manifest records every train/test true-frame-edge
row, attaches selected-only probe evidence where available, and keeps unprobed
rows on the clearer-source review route without including raw frames.

## rule

Before rebuilding a landmark cache after relabel diagnostics, materialize a
disposition manifest that lists cache candidates, exclusions, and clearer-source
review routes. Keep the manifest deterministic and generated by the existing
audit script so the receipt chain can verify it. A bounded probe is not enough
once the full backlog is available.

## examples

- `docs/validation/return-to-form-m3jb-frame-edge-disposition-manifest-v1.json`
- `current_state.landmark_frame_edge_disposition_manifest`
- `landmark_frame_edge_disposition_manifest_recorded`

## linked files

- `docs/validation/return-to-form-m3jb-frame-edge-disposition-manifest-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 40. Turn disposition manifests into cache-input blocklists

date: 2026-06-02
source slice: docs/session-logs/868-mission-3jb-frame-edge-exclusion-seed.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had a full disposition manifest for true frame-edge/OOB landmark
rows, but a future cache rebuild still needed a smaller explicit artifact that
cache-building code can treat as a denylist input.

## gotcha / pattern

A row-level review manifest is useful for humans, but cache safety needs a
direct blocklist-style seed: stable candidate keys, source row identifiers, the
policy reasons, and an explicit `block_from_landmark_cache_rebuild` flag.

## rule

When a relabel probe proves a group is unsafe, materialize a generated exclusion
seed before moving on to heatmap/cache work. Keep the seed derived from the
canonical disposition manifest so its source SHA and counts are auditable.

## examples

- `docs/validation/return-to-form-m3jb-frame-edge-exclusion-seed-v1.json`
- `current_state.landmark_frame_edge_exclusion_seed`
- `landmark_frame_edge_exclusion_seed_recorded`

## linked files

- `docs/validation/return-to-form-m3jb-frame-edge-exclusion-seed-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 41. Bound clearer-source review before asking for cache rebuild

date: 2026-06-02
source slice: docs/session-logs/869-mission-3jb-clearer-source-review-subset.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had `1116` unprobed true-frame-edge/OOB rows after the selected-only
exclusion seed. The next useful action was not another heatmap run; it was a
bounded review queue that points humans or later source-review tooling at the
highest-priority source rows.

## gotcha / pattern

An unbounded "review clearer source" instruction is too vague to execute. A
review subset needs split balance, stable review keys, source row metadata,
priority scoring, and an explicit statement that it authorizes no cache rebuild.

## rule

Before rebuilding landmark caches from a large frame-edge backlog, create a
bounded clearer-source review subset from the existing disposition manifest.
Keep it source-linked and metadata-only; do not embed frames or turn review
selection into training-label approval.

## examples

- `docs/validation/return-to-form-m3jb-clearer-source-review-subset-v1.json`
- `current_state.landmark_clearer_source_review_subset`
- `landmark_clearer_source_review_subset_recorded`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-subset-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 42. Initialize review outcomes fail-closed

date: 2026-06-02
source slice: docs/session-logs/870-mission-3jb-clearer-source-review-outcomes.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had a bounded clearer-source review subset, but no reviewed outcome
ledger where cache-safe replacements or explicit exclusions could be recorded.

## gotcha / pattern

A review queue alone can still be misread as permission to rebuild a cache from
selected rows. The outcome ledger must start with every row pending and
cache-blocked, and only a later reviewed entry may change replacement or
exclusion counts.

## rule

Create the review outcome ledger before accepting reviewer decisions. Default
every row to pending review, `cache_safe_replacement: null`,
`explicit_exclusion: null`, and `cache_rebuild_allowed: false`.
Cache-safe replacements must record source-frame provenance, a full-frame box or
21-landmark replacement, reviewer identity, and review time; explicit exclusions
must record the exclusion reason, reviewer, and review time.

## examples

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `current_state.landmark_clearer_source_review_outcomes`
- `landmark_clearer_source_review_outcomes_initialized`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 43. Make review packets preserve ledgers instead of replacing them

date: 2026-06-02
source slice: docs/session-logs/871-mission-3jb-clearer-source-review-packet.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB needed to move from a pending clearer-source outcome ledger toward
actual replacement/exclusion decisions. A generated audit writer that always
reinitializes rows would erase future review decisions.

## gotcha / pattern

Review packets and receipt writers must not overwrite reviewer decisions back to
pending. They also must not embed source frames or imply cache rebuild approval
just because source video is locally available.

## rule

Build review packets as metadata-only queues from pending ledger rows. Preserve
mutable reviewer fields by stable `review_key`, validate cache-safe replacements
and explicit exclusions before counting them, and fail the audit on invalid
review rows.

## examples

- `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`
- `current_state.landmark_clearer_source_review_packet`
- `landmark_clearer_source_review_packet_recorded`

## linked files

- `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`
- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 44. Update reviewer outcome rows by stable key

date: 2026-06-02
source slice: docs/session-logs/872-mission-3jb-clearer-source-outcome-exclusions.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB started filling the clearer-source review outcome ledger from the
metadata-only packet.

## gotcha / pattern

Generated JSON ledgers contain many repeated pending-review row shapes. Broad
text patches can update the wrong row while still passing schema validation.

## rule

When recording reviewer outcomes, update rows by stable `review_key` and then
assert the intended keys, statuses, source references, and aggregate counts
before regenerating receipts.

## examples

- `train:12717`
- `test:8672`
- `landmark_clearer_source_review_outcome_exclusions_recorded`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`

# 29. Separate current recognizer requirements from future tracker slots

date: 2026-06-02
source slice: docs/session-logs/857-mission-3jb-product-gate-reframe.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB needed the product question answered after the top-2/NMS baseline
and deterministic post-filter ceiling were recorded.

## gotcha / pattern

The current browser product can be fail-closed or preview-only while the model
lane still has future tracking gates. In the current `asl-pilot-web` code,
practice pass/fail is raw-frame/model-card based and live tracking emits
anonymous `hand_0`/`hand_1` display tracks; anatomical L/R assignment is not a
current recognizer requirement.

## rule

Do not keep treating a future stable-slot/handedness gate as a current
recognizer blocker unless current browser pass/fail code actually consumes that
slot identity.

## examples

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`
- `../asl-pilot-web/web/src/components/PracticeApp.tsx`
- `../asl-pilot-web/web/src/lib/live-tracker.ts`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 28. Record deterministic post-filter ceilings as ceilings

date: 2026-06-02
source slice: docs/session-logs/856-mission-3jb-deterministic-postfilter-ceiling.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB redirected from more learned-selector training to local deterministic
filters for the audited candidate-selection failure modes.

## gotcha / pattern

An audit-tag oracle fallback can measure a post-filter ceiling, but it is not a
runtime selector. In Session 856, the named filters lifted the candidate-head
selector ceiling to `coverage=0.988095` and
`distinct_assigned_coverage=0.976190`, still just short of the `>=0.98`
distinct-assignment gate.

## rule

When using failure-taxonomy tags to estimate deterministic filters, label the
result as a ceiling and keep the gate fail-closed until a runtime-available
filter or product gate reframe is recorded.

## examples

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 30. Mirror product gate reframes in canonical gates

date: 2026-06-02
source slice: docs/session-logs/858-mission-3jb-current-vs-future-box-gate-split.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had already answered that current browser pass/fail does not
consume anatomical L/R hand identity, but the canonical receipt still exposed
box status as one failed bucket.

## gotcha / pattern

A product gate reframe is easy to lose if it lives only in narrative receipt
fields. Future executors can still read `gates.boxes.status=failed_open` and
restart selector training for a future-only requirement.

## rule

When a product gate is reframed, mirror the split inside the canonical `gates`
object: current product proxy status separately from future tracker/slot
contract status.

## examples

- `current_vs_future_box_gate_split.current_product_box_proxy.status`
- `gates.boxes.current_product_proxy.status`
- `gates.boxes.future_tracker_slot_contract.status`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 31. Treat heatmap gains as crop-policy evidence, not gate passage

date: 2026-06-02
source slice: docs/session-logs/859-mission-3jb-landmark-heatmap-crop-quality-baseline.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB advanced from the demo-complete two-hand box stage to the landmark
and per-hand crop-quality stage.

## gotcha / pattern

The scratch heatmap/soft-argmax head is the right pose-estimation family, but
the best current receipt still records `PCK@0.10=0.801000` and
`PCK@0.05=0.465600`, below the `0.90` / `0.75` landmark gate.

## rule

When heatmap landmarks improve but stay below gate, record them as the current
landmark baseline and spend the next local slice on crop/relabel quality and
browser coordinate mapping before longer training.

## examples

- `current_state.landmark_heatmap_evidence`
- `current_state.landmark_crop_quality_bottleneck`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 32. Turn heatmap failures into fixed crop-policy backlogs

date: 2026-06-02
source slice: docs/session-logs/860-mission-3jb-relabel-candidate-backlog.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had a scratch heatmap landmark head below gate and crop-quality
audits showing edge/OOB/high-error rows as the bottleneck.

## gotcha / pattern

"Try a heatmap filter" is easy to misread as a browser runtime visual effect or
as permission to spend on longer landmark training. In this lane, the heatmap
head needs a fixed crop/relabel review set first.

## rule

When heatmap landmarks fail mainly on crop quality, record a source-preserved
candidate backlog with counts, dominant recommended actions, and source row
pointers before changing crop policy or running longer training.

## examples

- `current_state.landmark_relabel_candidate_backlog`
- `gates.landmarks.metrics.relabel_candidates_test_selected`
- `gates.landmarks.metrics.relabel_candidates_train_selected`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 33. Check whether visibility masking is sufficient before rebuilding crops

date: 2026-06-02
source slice: docs/session-logs/861-mission-3jb-oob-mask-policy-probe.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB had a fixed source-preserved crop/relabel backlog dominated by
edge/OOB rows, where the proposed local actions were crop-context rebuild or
out-of-bounds keypoint masking.

## gotcha / pattern

Visible/in-bounds keypoint scoring can improve aggregate OOB metrics while
still leaving every worst-case backlog row far below the landmark gate.

## rule

Before treating OOB masking as a solution, measure it against the fixed backlog.
If visible-only PCK does not produce gate-quality rows, keep masking as hygiene
and spend the next implementation slice on crop-context rebuild.

## examples

- `current_state.landmark_oob_mask_policy_probe`
- `gates.landmarks.metrics.relabel_candidates_test_visible_pck_gte_090`
- `gates.landmarks.metrics.sourcepreserved_test_oob_visible_delta`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 34. Separate crop-context expansion from true frame-edge label problems

date: 2026-06-02
source slice: docs/session-logs/862-mission-3jb-crop-context-geometry-probe.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB next needed a crop-context rebuild proof for a fixed edge/OOB
source-preserved backlog.

## gotcha / pattern

If the preserved teacher box already touches the original source crop and the
source crop itself touches the full-frame edge, making the per-hand square
bigger can preserve the bad label geometry instead of fixing it.

## rule

Before rebuilding a crop cache, compute the source-crop expansion ceiling from
the preserved geometry. If default expansion and full-frame relabel crops barely
resolve teacher-edge rows, route the next slice to targeted relabel or
clearer-source review instead of another context multiplier.

## examples

- `current_state.landmark_crop_context_geometry_probe`
- `gates.landmarks.metrics.crop_context_test_source_expand_resolved_count`
- `gates.landmarks.metrics.crop_context_train_full_frame_unresolved_count`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 45. Record unavailable neighbor frames for terminal-edge reviews

date: 2026-06-02
source slice: docs/session-logs/874-mission-3jb-clearer-source-train-test-exclusions.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB was filling the fail-closed clearer-source review outcome ledger
before any landmark cache rebuild or longer heatmap training.

## gotcha / pattern

Some packet rows request a center frame plus `+/-2` neighbors, but source clips
can end at the center frame. Treating the full five-frame window as reviewed
would overstate the available evidence.

## rule

When a source-review row is at the start or end of its video, record only the
frames that actually exist and include the unavailable neighbor frame indices in
the outcome ledger. If the visible hand is still clipped at the source frame
edge, use an explicit exclusion rather than a replacement label.

## examples

- `explicit_exclusion.source_frame_reference.frame_indices_reviewed`
- `explicit_exclusion.source_frame_reference.unavailable_frame_indices`
- `visual_source_review_frame_edge_oob`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`

# 46. Verify concurrent outcome rows before preserving them

date: 2026-06-02
source slice: docs/session-logs/875-mission-3jb-clearer-source-train-test-exclusions.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB was updating the clearer-source outcome ledger by stable
`review_key` while parallel executor state could touch the same JSON files.

## gotcha / pattern

A clean-start slice can still find the outcome ledger dirty after contact-sheet
review if another agent recorded the paired train/test row. Reverting that row
would discard potentially valid visual evidence; preserving it without
inspection would weaken the receipt.

## rule

When the same outcome ledger contains a concurrent reviewed row, inspect its
temp contact sheet and row metadata before regenerating receipts. Preserve the
row only if the visual evidence supports the same reviewer decision, then make
the session log explicit about the verified paired-row state.

## examples

- `train:14925`
- `test:8513`
- `visual_review_temp_contact_sheet`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/875-mission-3jb-clearer-source-train-test-exclusions.md`

# 47. Trust regenerated packet pointers only after the writer pass

date: 2026-06-02
source slice: docs/session-logs/876-mission-3jb-clearer-source-train-test-exclusions.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB was filling the clearer-source review outcome ledger while the
metadata-only review packet rolls forward to the next pending rows.

## gotcha / pattern

After recording a row outcome, the old packet still points at the pre-review
first rows until `scripts/audit_m3jb_hand_state_tracker.mjs --write-receipt`
regenerates it. Reading the packet too early can make the next action look
stale.

## rule

After each reviewer outcome update, run the existing writer before documenting
the next pending train/test rows. Treat the regenerated packet, outcome summary,
and canonical receipt hashes as the source of truth for the next slice.

## examples

- `train:25560`
- `test:10729`
- `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`

## linked files

- `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`

# 48. Preserve packet-bounded frame windows at clip start

date: 2026-06-02
source slice: docs/session-logs/877-mission-3jb-test-10729-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB was reviewing clearer-source packet rows where the center frame can
sit at the very start of the source video.

## gotcha / pattern

Start-of-clip rows do not have negative neighbor frames. The packet already
normalizes the review window to available nonnegative frame indices, so adding a
synthetic five-frame window in the outcome would misrepresent the evidence.

## rule

For source-review rows at frame `0`, preserve the packet-bounded frame window
in the outcome ledger. If frames `0-2` already show the requested hand clipped
at the source edge, record an explicit exclusion rather than inventing missing
pre-roll context.

## examples

- `test:10729`
- `frame_indices_reviewed: [0, 1, 2]`
- `visual_source_review_frame_edge_oob`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/877-mission-3jb-test-10729-exclusion.md`

# 49. Keep heatmap work downstream of edge-crop hygiene

date: 2026-06-02
source slice: docs/session-logs/878-mission-3jb-test-9990-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB has a scratch heatmap/soft-argmax landmark path, but the current
local slice is still clearing frame-edge and crop-quality defects before any
landmark cache rebuild or longer heatmap training. Session 878 reviewed a
frame-0 diagnostic test row where the target hand was visually present but the
teacher box was clamped to both the right and bottom source-frame boundaries.

## gotcha / pattern

A heatmap head can make landmark learning less brittle, but it cannot make
clipped source supervision correct. If a packet row shows the requested hand
cut off at the frame boundary, training or filtering with that row would teach
the wrong target. A mostly visible hand can still be unsafe landmark
supervision when the crop touches two source edges, because fingertips, side
contour, or wrist context may be outside the frame.

## rule

Keep heatmap work downstream of explicit crop hygiene. Record clipped
clearer-source rows as exclusions first, keep cache rebuild blocked, and only
spend on heatmap training after the reviewer ledger has enough clean
replacements or exclusions. Do not promote a replacement just because the hand
is recognizable when it remains edge-clipped across the packet-bounded review
window.

## examples

- `test:9990`
- `teacher_box_full_frame: [0.577903, 0.629635, 1, 1]`
- `frame_indices_reviewed: [0, 1, 2]`
- `visual_source_review_frame_edge_oob`
- `cache_rebuild_allowed: 0`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `docs/session-logs/878-mission-3jb-test-9990-exclusion.md`

# 50. Use the whole review window to confirm persistent source-edge clipping

date: 2026-06-02
source slice: docs/session-logs/879-mission-3jb-test-8416-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row with a normal five-frame review
window around the center frame, not a start-of-clip truncated window.

## gotcha / pattern

One edge-contact frame can sometimes be a transient crop artifact, but
persistent edge contact across the full packet-bounded window is stronger
evidence that the source row is not safe landmark supervision.

## rule

When the requested hand stays clipped against the same source-frame boundaries
across all reviewed neighbor frames, record an explicit frame-edge/OOB
exclusion and keep cache rebuild blocked. Do not search for a replacement from
that row unless another source window exists and is explicitly reviewed.

## examples

- `test:8416`
- `frame_indices_reviewed: [44, 45, 46, 47, 48]`
- `teacher_box_full_frame: [0, 0.701416, 0.253923, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/879-mission-3jb-test-8416-exclusion.md`

# 51. Do not use start-of-sign setup frames when the hand starts off-frame

date: 2026-06-02
source slice: docs/session-logs/880-mission-3jb-test-10021-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row at frame `0` where the requested
hand was entering from the lower-left source-frame boundary.

## gotcha / pattern

Start-of-sign frames can show a recognizable setup pose, but they are still bad
landmark supervision when the hand begins partly outside the source frame. A
cache rebuild would preserve the truncated geometry as if it were a complete
hand.

## rule

For frame-0 clearer-source rows, preserve the packet-bounded review window and
exclude the row if the requested hand remains source-clipped across available
neighbor frames. Do not create a replacement label from the setup frames unless
a later, fully in-frame source window is explicitly reviewed.

## examples

- `test:10021`
- `frame_indices_reviewed: [0, 1, 2]`
- `teacher_box_full_frame: [0, 0.888186, 0.223137, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/880-mission-3jb-test-10021-exclusion.md`

# 52. Treat repeat frame-0 lower-edge clips consistently

date: 2026-06-02
source slice: docs/session-logs/881-mission-3jb-test-10480-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed another frame-0 diagnostic test row where the requested
left/first hand was visible but clipped against the left and bottom
source-frame boundaries.

## gotcha / pattern

Adjacent setup-frame rows can look like useful labels because the hand shape is
partly visible. For landmark supervision, the repeated lower-left source clip
is the important fact: the missing geometry would be preserved as if it were
complete.

## rule

When the frame-0 packet window shows the same lower-edge clip pattern already
captured in the ledger, keep applying the same exclusion standard. Do not let
recognizable partial hands become cache-safe replacements unless a fully
in-frame source window is explicitly reviewed.

## examples

- `test:10480`
- `frame_indices_reviewed: [0, 1, 2]`
- `teacher_box_full_frame: [0, 0.796752, 0.315732, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/881-mission-3jb-test-10480-exclusion.md`

# 53. Use the same exclusion standard for mid-clip lower-edge crops

date: 2026-06-02
source slice: docs/session-logs/882-mission-3jb-test-8270-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row with a full five-frame window
around a mid-clip frame, not a start-of-clip setup window.

## gotcha / pattern

The hand can be mostly visible and still be unsafe landmark supervision when
the box is pinned to the bottom source-frame boundary across the reviewed
window. The missing lower contour or fingertips would make the target geometry
incomplete.

## rule

For clearer-source rows, do not relax the frame-edge/OOB rule just because the
clip is mid-sign rather than frame `0`. If the requested hand remains clipped
at the lower source edge across the reviewed local window, record an explicit
exclusion and keep cache rebuild blocked.

## examples

- `test:8270`
- `frame_indices_reviewed: [8, 9, 10, 11, 12]`
- `teacher_box_full_frame: [0.19106, 0.805991, 0.394117, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/882-mission-3jb-test-8270-exclusion.md`

# 54. Treat repeated lower-edge hand drift as incomplete source geometry

date: 2026-06-02
source slice: docs/session-logs/883-mission-3jb-test-9777-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row where the requested hand moved
through the review window but stayed clipped against the lower source-frame
boundary.

## gotcha / pattern

Motion across the window can make a row look more useful than a static clipped
setup frame. For landmark supervision, the important part is whether the
complete hand geometry ever becomes visible. If the lower contour remains out
of frame, a cache rebuild would preserve incomplete geometry.

## rule

For clearer-source rows, require the reviewed window to show complete source
geometry before creating a replacement label. If a moving hand remains clipped
at the lower frame edge across the window, record an explicit exclusion and
keep cache rebuild blocked.

## examples

- `test:9777`
- `frame_indices_reviewed: [11, 12, 13, 14, 15]`
- `teacher_box_full_frame: [0.21821, 0.798518, 0.4075, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/883-mission-3jb-test-9777-exclusion.md`

# 78. Sync the recognizer teacher checkpoint with distillation caches

date: 2026-06-03
source slice: docs/session-logs/912-mission-3jb-recognizer-transformer-preflight-sync.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

Mission 3JB pivoted to the Transformer recognizer distillation campaign. The
active prompt named the updated recognizer code plus `.cache/recog-seq-w64-merged`
and `.cache/handcrop-lm2`, but the trainer also defaults to the clean-landmark
teacher checkpoint at `output/recognizer-v1.pt`.

## gotcha / pattern

Copying the two caches alone leaves the remote run technically able to train a
teacher in memory, but that wastes the approved CUDA envelope and changes the
intended preflight surface.

## rule

For recognizer distillation Brev sync, include `output/recognizer-v1.pt` with the
student cache, teacher cache, and recognizer code; then run a no-save CUDA load
check before launching full training.

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-transformer-preflight-sync-v1.json`
- `docs/session-logs/912-mission-3jb-recognizer-transformer-preflight-sync.md`

# 83. Brev shell READY is not enough for launch

date: 2026-06-03
source slice: docs/session-logs/917-mission-3jb-recognizer-low-lr-fulltrain-brev-preflight-blocker.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The retained L40S worker listed `READY` during the low-LR recognizer fulltrain
preflight, but SSH never connected and the workspace health degraded to
`UNHEALTHY`.

## gotcha / pattern

Do not treat `shell_status: READY` as launch-ready by itself. A paid fulltrain
run needs a successful remote command that proves SSH, CUDA, and no conflicting
training process before syncing code or launching training.

## rule

For Brev training slices, require both `brev ls --json` and a successful remote
CUDA/process preflight. If either fails, stop the worker, record the blocker,
and do not launch training.

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-low-lr-fulltrain-brev-preflight-blocker-v1.json`
- `docs/session-logs/917-mission-3jb-recognizer-low-lr-fulltrain-brev-preflight-blocker.md`

# 82. Tiny overfit can isolate optimizer failure from architecture failure

date: 2026-06-03
source slice: docs/session-logs/916-mission-3jb-recognizer-transformer-tiny-failure-debug.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The run1 Transformer shape failed the first 32-clip hard-label/no-augmentation
tiny overfit at lr `1e-3`, while the GRU control passed.

## gotcha / pattern

The same Transformer shape overfit the same split when lr was reduced to
`5e-4`, and a smaller CLS Transformer also overfit. That separates optimizer
settings from architecture and trainer wiring.

## rule

When a Transformer tiny-overfit check fails but gradients and updates are
nonzero, retry the identical shape at a lower LR before changing pooling,
deleting capacity, or assuming the data path is broken.

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-transformer-tiny-failure-debug-v1.json`
- `docs/session-logs/916-mission-3jb-recognizer-transformer-tiny-failure-debug.md`

# 81. A GRU control can separate diagnostic failure from data failure

date: 2026-06-03
source slice: docs/session-logs/915-mission-3jb-recognizer-local-overfit-diagnostics.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

After the first full-scope Transformer recognizer run stayed near chance, the
local diagnostic matrix compared the existing GRU and run1 Transformer on the
same tiny hard-label/no-augmentation split.

## gotcha / pattern

The GRU overfit `32` clips while the Transformer did not, so the cache, labels,
and trainer loop are capable of producing a learning signal. The next blocker is
Transformer-specific behavior, not more full-scope compute.

## rule

When a new architecture fails full-scope training, run a known-good architecture
control on the same tiny split before blaming data. If the control overfits and
the new architecture does not, keep Brev stopped and debug the new architecture
locally.

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-local-overfit-diagnostics-v1.json`
- `docs/session-logs/915-mission-3jb-recognizer-local-overfit-diagnostics.md`

# 80. Prove tiny overfit before paying for another flat-loss run

date: 2026-06-03
source slice: docs/session-logs/914-mission-3jb-recognizer-transformer-research-triage.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The first full-scope Transformer recognizer run stayed near chance for 160
epochs while the historical GRU baseline learned on the same general
distillation setup.

## gotcha / pattern

When loss stays essentially flat, a larger paid run is not the next useful
experiment. First prove the new architecture can overfit a tiny supervised
subset locally with augmentation and distillation removed.

## rule

Before another recognizer Brev launch, run no-save local diagnostics that compare
GRU and Transformer on the same tiny hard-label/no-augmentation subset, and
record train-subset accuracy plus gradient/logit/update evidence.

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-transformer-run1-research-triage-v1.json`
- `docs/session-logs/914-mission-3jb-recognizer-transformer-research-triage.md`

# 79. Treat flat monitor accuracy as a tuning blocker before rerun

date: 2026-06-03
source slice: docs/session-logs/913-mission-3jb-recognizer-transformer-fulltrain-run1.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The first full-scope M3JB Transformer recognizer run used the approved Brev
worker with full data, no `--limit-*` flags, and a larger
`d_model=256` / `n_layers=6` / `n_heads=8` architecture.

## gotcha / pattern

The loss barely moved and monitor top-1 stayed near `0.019` for all 160 epochs,
then test metrics landed below chance-ish baseline behavior: top-1 `0.008`,
top-5 `0.0502`, and verification recall@FAR10 `0.1124`.

## rule

Do not launch a second recognizer Brev run as a blind size/epoch rerun after flat
monitor accuracy. Do research-guided metric triage first, focusing on optimizer
scale, loss weighting/distillation balance, label/teacher coverage, and
Transformer training stability.

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run1-v1.json`
- `docs/session-logs/913-mission-3jb-recognizer-transformer-fulltrain-run1.md`

# 77. Make side-worktree model code reviewable before paid runs

date: 2026-06-03
source slice: docs/session-logs/910-mission-3jb-resunet-architecture-preflight.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

The M3JB PCK campaign needed a scratch residual heatmap architecture before a
fourth paid Brev experiment. The active trainer lived in the annotator
side-worktree, not the main repo.

## gotcha / pattern

If side-worktree model code stays untracked or uncommitted, the main repo can
record a launch envelope that reviewers cannot reproduce or diff. A local smoke
alone is not enough evidence for a paid run.

## rule

Before queueing a paid model variant that depends on side-worktree code, commit
that side code, record the exact commit and file hash in the main receipt, and
bind the planned Brev command to that hash.

## linked files

- `docs/validation/return-to-form-m3jb-landmark-pck-resunet-architecture-preflight-v1.json`
- `docs/session-logs/910-mission-3jb-resunet-architecture-preflight.md`

# 55. Treat no-clear-win campaign runs as evidence, not momentum

date: 2026-06-03
source slice: docs/session-logs/908-mission-3jb-landmark-pck-run3-brev.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB run3 changed the training distribution with hard-geometry
oversampling plus mild augmentation, then measured eval-only PCK@0.10 and
PCK@0.05 after full training.

## gotcha / pattern

A run can satisfy the "real experiment" requirement and still be a bad next
model. Run3 moved the model but regressed both PCK thresholds versus the
running-best run2 checkpoint.

## rule

Record no-clear-win runs explicitly, keep the browser fail-closed, stop the
worker, and refresh research guidance before spending on another paid
experiment when the saved no-code levers are exhausted.

## linked files

- `docs/validation/return-to-form-m3jb-landmark-pck-campaign-run3-w128-g64-hardgeomaug-fulltrain-brev-v1.json`
- `docs/session-logs/908-mission-3jb-landmark-pck-run3-brev.md`

# 56. Research refreshes can select code preflight, not a paid run

date: 2026-06-03
source slice: docs/session-logs/909-mission-3jb-post-run3-research-refresh.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

After run3 regressed both held-out PCK thresholds, the active directive required
a no-Brev research refresh before another paid experiment.

## gotcha / pattern

The highest-impact recommendation was not an immediate run. It selected a
scratch residual U-Net / lightweight hourglass heatmap architecture, which
requires local code, smoke, and audit evidence before Brev.

## rule

When a research refresh selects a new architecture lever, convert the next
action to a local-only architecture preflight and keep any paid run token as a
candidate until the preflight is committed with exact runtime/spend/kill/teardown
details.

## linked files

- `docs/validation/return-to-form-m3jb-landmark-pck-research-refresh-after-run3-v1.json`
- `artifacts/research/m3jb-landmark-pck-refresh-909/response.md`
- `docs/session-logs/909-mission-3jb-post-run3-research-refresh.md`

# 77. Separate running-best wins from gate passage

date: 2026-06-03
source slice: docs/session-logs/907-mission-3jb-landmark-pck-run2-brev.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB run2 improved the landmark student's held-out PCK from run1
`0.739200` / `0.453300` to `0.749600` / `0.486700`, but the acceptance gates
remain `0.90` / `0.75`.

## gotcha / pattern

A clear running-best model win is not the same as browser/runtime readiness.
When a campaign is metric-driven, the receipt must preserve both comparisons:
delta versus the prior running best and remaining gap to the gate.

## rule

Record running-best deltas and gate gaps side by side. Keep browser artifacts
fail-closed until the gate comparison passes, even when the experiment is a
real improvement.

## linked files

- `docs/validation/return-to-form-m3jb-landmark-pck-campaign-run2-w128-g64-fulltrain-brev-v1.json`
- `docs/session-logs/907-mission-3jb-landmark-pck-run2-brev.md`

# 55. Verify heatmap head shape, not just CLI flag presence

date: 2026-06-03
source slice: docs/session-logs/906-mission-3jb-landmark-pck-run1-brev.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB launched the first research-guided landmark PCK campaign run with
`--heatmap-g 48`. The trainer accepted the flag, but the head still emitted a
64x64 heatmap for the 128px crop path, and `soft_argmax(..., g=48)` failed on
reshape.

## gotcha / pattern

Flag-level preflight can miss shape-contract bugs when a model's internal
upsampling uses powers of two. For non-power-of-two heatmap grids, instantiate
the actual model and check the tensor shape before launching a full Brev run.

## rule

For future landmark resolution/capacity experiments, preflight both CLI support
and a shape smoke such as `PerHandHeatmapNet(g=G,width=W)(zeros(...)).shape`.
The expected head must be `(batch, 21, G, G)` before training or eval starts.

## linked files

- `docs/validation/return-to-form-m3jb-landmark-pck-campaign-run1-w96-g48-fulltrain-brev-v1.json`
- `docs/session-logs/906-mission-3jb-landmark-pck-run1-brev.md`

# 56. Do not accept bottom-pinned seated hand rests

date: 2026-06-02
source slice: docs/session-logs/885-mission-3jb-test-7349-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `TV` where the requested
right/second hand rested low in the frame across frames `44-48`.

## gotcha / pattern

Resting hands can look stable and easy to localize, but if the teacher box is
pinned to the bottom source-frame boundary, the lower contour and fingertips
can still be clipped. Stability does not make incomplete source geometry safe
for 21-landmark supervision.

## rule

For seated/resting-hand clearer-source rows, keep the same frame-edge rule:
require complete hand geometry in the reviewed source window before creating a
replacement label. If the hand remains bottom-clipped, record an explicit
frame-edge/OOB exclusion and keep cache rebuild blocked.

## examples

- `test:7349`
- `frame_indices_reviewed: [44, 45, 46, 47, 48]`
- `teacher_box_full_frame: [0.695843, 0.892421, 0.965916, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/885-mission-3jb-test-7349-exclusion.md`

# 57. Exclude forearm-only hungry rows from landmark cache rebuild

date: 2026-06-02
source slice: docs/session-logs/886-mission-3jb-test-9586-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `hungry` where the requested
left/first hand moved near the lower frame edge across frames `40-44`.

## gotcha / pattern

The teacher box can appear to follow the intended limb while still containing
mostly forearm and missing the actual hand. For 21-landmark supervision, a
forearm-dominant bottom-pinned crop is not a usable hand-state target.

## rule

When the reviewed source window shows the requested hand below the source
frame and the box mostly covers forearm, record an explicit frame-edge/OOB
exclusion. Do not create a cache-safe replacement unless a reviewed window
shows the complete hand geometry in-frame.

## examples

- `test:9586`
- `frame_indices_reviewed: [40, 41, 42, 43, 44]`
- `teacher_box_full_frame: [0.03, 0.744593, 0.346307, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/886-mission-3jb-test-9586-exclusion.md`

# 58. Treat bottom-pinned moving-hand rows as exclusions

date: 2026-06-02
source slice: docs/session-logs/887-mission-3jb-test-11668-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `yesterday` where the requested
left/first hand moved through the lower frame edge across frames `10-14`.

## gotcha / pattern

Motion blur and sign motion can make a bottom-pinned crop look plausible
because the intended limb is visible in the right area. Landmark supervision
still needs complete hand geometry, not just a plausible forearm/hand region.

## rule

When the teacher box is bottom-pinned throughout the reviewed source window and
the requested hand is clipped by the source frame, record an explicit
frame-edge/OOB exclusion. Do not create a replacement label from a moving crop
unless the full hand is visible in-frame.

## examples

- `test:11668`
- `frame_indices_reviewed: [10, 11, 12, 13, 14]`
- `teacher_box_full_frame: [0.166102, 0.800871, 0.361831, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/887-mission-3jb-test-11668-exclusion.md`

# 59. Reject setup-frame edge slivers as hand labels

date: 2026-06-02
source slice: docs/session-logs/888-mission-3jb-test-7360-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `after` at clip start. The
teacher box touched the left source-frame boundary across frames `0-2` and
captured only a narrow edge sliver.

## gotcha / pattern

Frame-0 setup rows can contain a plausible colored region at the frame edge
without containing the requested hand. A sliver that touches the source border
is not recoverable as a 21-landmark hand target just because the signer is
otherwise visible.

## rule

For clearer-source review rows, reject source-edge slivers that do not contain
complete requested-hand geometry. Record an explicit frame-edge/OOB exclusion
and keep cache rebuild blocked unless the reviewed window shows the full hand
in-frame.

## examples

- `test:7360`
- `frame_indices_reviewed: [0, 1, 2]`
- `teacher_box_full_frame: [0, 0.353059, 0.101421, 0.563049]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/888-mission-3jb-test-7360-exclusion.md`

# 60. Reject blurred bottom-pinned partial hands

date: 2026-06-02
source slice: docs/session-logs/889-mission-3jb-test-8406-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `carrot` where the requested
left/first hand moved near the lower frame edge across frames `42-46`.

## gotcha / pattern

A crop can contain motion-blurred fingers in some frames and forearm in others
while still being pinned to the lower source boundary. That does not make it a
safe landmark target; it teaches the 21-landmark student from partial geometry.

## rule

For clearer-source rows, require complete hand geometry across the reviewed
window before creating a replacement label. If the selected region is
bottom-pinned and alternates between blurred partial hand and forearm, record an
explicit frame-edge/OOB exclusion and keep cache rebuild blocked.

## examples

- `test:8406`
- `frame_indices_reviewed: [42, 43, 44, 45, 46]`
- `teacher_box_full_frame: [0.501412, 0.857737, 0.746049, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/889-mission-3jb-test-8406-exclusion.md`

# 65. Treat hand heatmaps as a landmark head, not a solved filter

date: 2026-06-02
source slice: docs/session-logs/894-mission-3jb-heatmap-retrain-readiness.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

A coworker suggested a heatmap filter for hands while M3JB was parked between
batch crop review and landmark retraining.

## gotcha / pattern

Heatmaps help when they are the scratch landmark model's output
representation: per-keypoint heatmap logits plus soft-argmax decode. They do
not magically repair clipped/OOB teacher labels or source-frame crop errors
after the fact.

## rule

Route the next landmark fit through the heatmap/soft-argmax student after
rebuilding the crop cache, but keep it fail-closed until held-out PCK@0.10 and
PCK@0.05 move against the baseline and browser coordinate mapping is proven.

## examples

- best recorded heatmap candidate: PCK@0.10 `0.801000`, PCK@0.05 `0.465600`
- gate: PCK@0.10 `>=0.90`, PCK@0.05 `>=0.75`

## linked files

- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`
- `scripts/audit_m3jb_hand_state_tracker.mjs`

# 66. Treat cache-rebuild eval as a measurement, not retrain proof

date: 2026-06-02
source slice: docs/session-logs/895-mission-3jb-cache-rebuild-eval.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB rebuilt the per-hand crop cache after batch-finishing the clearer-source
ledger with `64` explicit frame-edge/OOB exclusions, then evaluated the
existing scratch checkpoint on the rebuilt cache.

## gotcha / pattern

Removing known bad crops can move held-out PCK a little without proving that
the landmark model learned anything new. The measurement is useful because it
checks the data-policy lever, but it must not be described as a retrained
checkpoint, browser readiness, or landmark gate passage.

## rule

Record cache-rebuild eval-only measurements as fail-closed data evidence. Keep
the next proof focused on retraining the scratch landmark student on the
rebuilt cache and re-measuring PCK@0.10 / PCK@0.05 against the gate.

## examples

- rebuilt cache rows: `30120`
- excluded source hands: `64`
- eval-only PCK@0.10: `0.663300` (`+0.004600`)
- eval-only PCK@0.05: `0.372200` (`+0.002600`)

## linked files

- `docs/validation/return-to-form-m3jb-landmark-cache-rebuild-eval-v1.json`
- `docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`

# 67. Make heavy retrains approval-gated before launch

date: 2026-06-02
source slice: docs/session-logs/896-mission-3jb-landmark-retrain-brev-plan.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB reached the first truly compute-bound landmark step after batch finishing
the crop review, rebuilding the per-hand cache, and measuring eval-only PCK on
the existing scratch checkpoint.

## gotcha / pattern

An active prompt can authorize Brev as the right compute surface without
granting current-thread approval to spend. Launching from that state would mix
planning, remote mutation, training, and checkpoint creation into one
hard-to-review slice.

## rule

Before a heavy Brev landmark retrain, record the exact train/eval/copyback
route, runtime and spend limits, duplicate-worker guardrails, kill conditions,
and claim boundary in the existing receipt chain. Keep the launch blocked until
the user explicitly approves the spend in the current thread.

## examples

- status: `blocked_pending_explicit_brev_approval`
- scratch train: `true`
- warm start: `false`
- cache rows: `30120`
- planned metrics: PCK@0.10 and PCK@0.05

## linked files

- `docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json`
- `docs/session-logs/896-mission-3jb-landmark-retrain-brev-plan.md`

# 68. Keep durable prompts aligned after approval gates move

date: 2026-06-02
source slice: docs/session-logs/897-mission-3jb-approval-gate-prompt-alignment.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB had a committed approval-gated Brev launch plan, but `GOAL.md` still
started with the broader completed directive token. A stale executor payload
could keep repeating the older top-2/NMS or broad retrain wording unless the
durable prompts made the current approval gate explicit.

## gotcha / pattern

Recording a blocked launch plan is not enough when the loop rereads prompt
files every turn. If the prompt still sounds like "go retrain," it can erase
the approval boundary in the next autonomous pass.

## rule

When a heavy-compute route moves from planning to approval-gated launch, update
both `GOAL.md` and the active per-milestone prompt to name the exact next
action, receipt path, blocked status, and stale-context launch prohibition.
Bind those terms in the existing mission audit. If a background Codex launch is
also requested while the next action is approval-gated Brev spend, record only a
dry-run/no-launch receipt unless the user explicitly asks to start the loop.

## examples

- next action: `await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan`
- blocked status: `blocked_pending_explicit_brev_approval`
- receipt: `docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json`
- dry-run receipt: `docs/validation/return-to-form-m3jb-codex-supervisor-dry-run-v1.json`

## linked files

- `GOAL.md`
- `docs/model/return-to-form-m3jb-hierarchical-hand-state-tracker-goal-loop-prompt.md`
- `scripts/audit_m3jb_hand_state_tracker.mjs`
- `docs/session-logs/897-mission-3jb-approval-gate-prompt-alignment.md`

# 69. Preflight stale loop and trainer launches before approval

date: 2026-06-02
source slice: docs/session-logs/898-mission-3jb-both-loop-dry-run.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

A stale objective payload kept naming `bash scripts/start_codex_goal_loop.sh
--role both` even though the live M3JB next action was explicit current-thread
Brev/GPU spend approval for the recorded landmark retrain plan. The same
approval-gated retrain plan also depended on side-worktree trainer/cache state
that could drift before the user approved spend.

## gotcha / pattern

`--role both` is a persistent executor-plus-observer launch, not a bounded
single slice. Starting it while the next substantive action is human approval
would let the loop keep working past the current control-plane boundary. A
Brev launch plan can also go stale locally if trainer flags, hashes, cache
shapes, or output-path assumptions change before approval.

## rule

For background loop commands in stale or ambiguous objective payloads, record a
dry-run/no-launch receipt unless live `GOAL.md` explicitly asks for that
background loop and no approval gate or current blocker prevents it. The receipt
must name the generated profiles, actual launch status, and no-compute/no-loop
runtime boundary. For approval-gated training plans, also record local
trainer/cache/output preflight evidence before asking the next executor to
launch remote spend.

## examples

- dry-run command: `bash scripts/start_codex_goal_loop.sh --role both --dry-run`
- actual launch status: `not_run`
- executor/observer profile: `asl-pilot-local-skills`
- cache shape evidence: `30120` aligned frame/keypoint rows

## linked files

- `docs/validation/return-to-form-m3jb-codex-both-dry-run-v1.json`
- `docs/validation/return-to-form-m3jb-landmark-retrain-local-preflight-v1.json`
- `docs/session-logs/898-mission-3jb-both-loop-dry-run.md`

# 70. Treat Brev visibility as readiness, not approval

date: 2026-06-02
source slice: docs/session-logs/899-mission-3jb-brev-readiness-refresh.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB had an approval-gated landmark retrain plan and a local preflight receipt,
but the retained Brev worker state can drift while waiting for explicit
current-thread spend approval.

## gotcha / pattern

`brev ls --json` is useful and read-only, but it is not permission to spend and
does not prove the remote checkout has the side-worktree trainer/cache synced.
It only answers whether a worker is visible and plausibly ready for a future
approved launch preflight.

## rule

Before repeating stale Brev blocker or readiness claims, refresh `brev ls --json`
and record the selected worker state in the existing receipt chain. Keep the
receipt explicit that `brev exec`, copy/sync, lifecycle actions, SSH/rsync,
remote mutation, training, eval-only PCK, and checkpoint writes remain `not_run`
until the user approves current-thread spend.

## examples

- selected worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`
- ready state: `RUNNING` / `READY` / `HEALTHY`
- blocked command class: `brev exec`

## linked files

- `docs/validation/return-to-form-m3jb-brev-readiness-refresh-v1.json`
- `docs/session-logs/899-mission-3jb-brev-readiness-refresh.md`

# 71. Make approval text exact before GPU spend

date: 2026-06-02
source slice: docs/session-logs/900-mission-3jb-brev-approval-request.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB had a full approval-gated landmark retrain plan, local preflight, and
read-only worker readiness. The remaining blocker was not technical evidence
but explicit current-thread human approval for Brev/GPU spend.

## gotcha / pattern

General compute policy, old objective payloads, loop launch commands, local
preflight, and read-only `brev ls` readiness are all too indirect to authorize
spend. If the approval phrase is fuzzy, the next executor can accidentally infer
permission from the wrong artifact.

## rule

Before launching a paid/heavy GPU slice, write an approval-request receipt that
states the exact approval text, max spend, max runtime, worker identity,
authorized commands/classes, and exclusions. The receipt must also say it does
not itself record approval and that actual launch remains `not_run`.

## examples

- approval target: `M3JB landmark retrain plan v1`
- worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`
- max spend: `$40`
- max outer runtime: `21600s`

## linked files

- `docs/validation/return-to-form-m3jb-brev-approval-request-v1.json`
- `docs/session-logs/900-mission-3jb-brev-approval-request.md`

# 72. Stop adding readiness slices once approval is the only blocker

date: 2026-06-02
source slice: docs/session-logs/901-mission-3jb-brev-approval-blocker.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB had the launch plan, local preflight, read-only worker readiness, and exact
approval request recorded. The only remaining authorized next action was
explicit current-thread Brev/GPU spend approval.

## gotcha / pattern

After the approval request is exact, more local "readiness" receipts can become
busywork and can obscure that the loop is waiting on an external authorization.

## rule

When the active prompt requires explicit spend approval and no such approval is
present, record the repeated approval blocker once, keep launch `not_run`, and
stop. Do not run or prepare further paid/remote actions by inference.

## examples

- blocker: `missing_explicit_current_thread_brev_gpu_spend_approval`
- required approval receipt:
  `docs/validation/return-to-form-m3jb-brev-approval-request-v1.json`
- blocked command class: `brev exec`

## linked files

- `docs/validation/return-to-form-m3jb-brev-approval-blocker-v1.json`
- `docs/session-logs/901-mission-3jb-brev-approval-blocker.md`

# 73. Align approval surfaces before spending after a blocker

date: 2026-06-03
source slice: docs/session-logs/902-mission-3jb-brev-approval-alignment.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB received exact current-thread approval for the bounded landmark retrain
after the repo had already committed a strict missing-approval blocker receipt.
`GOAL.md` recorded the approval first, while the active prompt and receipts
still described the plan as blocked.

## gotcha / pattern

Launching immediately from mixed durable state can make the executor satisfy
one approval guard while violating another. The active prompt, plan receipt,
approval receipt, blocker receipt, and audit need to agree before any paid
remote action runs.

## rule

When approval arrives after a blocker receipt, first align the durable approval
surfaces in one no-spend slice: set the bounded plan and approval receipt to
current-thread approval true, resolve the blocker, update the active prompt,
and make the existing mission audit enforce the approved-but-not-launched
state. Then the next slice may launch only the recorded envelope.

## examples

- approved next action: `launch_approved_landmark_retrain_brev_plan_v1`
- retained worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`
- max spend/runtime: `$40` / `21600s`
- actual launch status: `not_run`

## linked files

- `GOAL.md`
- `docs/model/return-to-form-m3jb-hierarchical-hand-state-tracker-goal-loop-prompt.md`
- `docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json`
- `docs/validation/return-to-form-m3jb-brev-approval-request-v1.json`
- `docs/validation/return-to-form-m3jb-brev-approval-blocker-v1.json`
- `docs/session-logs/902-mission-3jb-brev-approval-alignment.md`

# 74. Treat below-baseline full retrains as pivot signals

date: 2026-06-03
source slice: docs/session-logs/903-mission-3jb-approved-landmark-retrain.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB consumed the approved Brev envelope for a full scratch landmark retrain on
the rebuilt `30120`-crop cache, then remeasured eval-only PCK@0.10 and
PCK@0.05.

## gotcha / pattern

A full, approved scratch retrain can still regress below the eval-only
baseline. When that happens, relaunching the same envelope would spend against
stale approval without adding new evidence.

## rule

If a compute-bound retrain completes below both baseline and gate, mark the
approval consumed, keep the browser fail-closed, stop the worker, and pivot
locally before asking for any new Brev run.

## examples

- approved run: `M3JB landmark retrain plan v1`
- rebuilt-cache baseline: PCK@0.10 `0.663300`, PCK@0.05 `0.372200`
- completed retrain: PCK@0.10 `0.648400`, PCK@0.05 `0.365100`
- next action: `analyze_m3jb_landmark_retrain_regression_and_select_pivot_no_brev`

## linked files

- `docs/validation/return-to-form-m3jb-landmark-retrain-brev-run-v1.json`
- `docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json`
- `docs/session-logs/903-mission-3jb-approved-landmark-retrain.md`

# 75. Pick a new lever after broad landmark retrain regression

date: 2026-06-03
source slice: docs/session-logs/904-mission-3jb-landmark-regression-pivot.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB compared the failed scratch landmark retrain against the rebuilt-cache
baseline after the approved Brev run was rejected fail-closed.

## gotcha / pattern

When only a couple of keypoints improve and validation PCK drops sharply, the
failure is not a single-row or single-joint cleanup problem. Repeating the same
quality-filtered training route or deleting more rows risks spending effort on
the already-rejected lever.

## rule

After a broad below-baseline retrain regression, record the pivot explicitly and
select a different lever before any new compute request. For M3JB landmarks,
the next lever is higher resolution / capacity preflight, not same-envelope
relaunch or more frame-edge row deletion.

## examples

- old next action: `analyze_m3jb_landmark_retrain_regression_and_select_pivot_no_brev`
- selected next action: `m3jb_landmark_resolution_capacity_preflight_no_brev`
- train crops removed by prior quality filter: `6553/22202`
- PCK@0.10 improved keypoints: `2/21`

## linked files

- `docs/validation/return-to-form-m3jb-landmark-retrain-regression-pivot-v1.json`
- `docs/session-logs/904-mission-3jb-landmark-regression-pivot.md`

# 76. Align approval mirrors before spending a campaign budget

date: 2026-06-03
source slice: docs/session-logs/905-mission-3jb-landmark-pck-campaign-research-plan.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB was redirected from a local no-Brev preflight into a research-guided
landmark PCK campaign with a bounded Brev budget recorded in `GOAL.md`, while
the active per-milestone prompt still carried the older no-Brev wording.

## gotcha / pattern

A current human approval in one durable surface can still be unsafe to spend
against when another required source-of-truth surface is stale. Launching from
that mismatch makes later audits ambiguous about which envelope was actually
authorized.

## rule

When a spend-approved campaign redirect lands in `GOAL.md`, mirror the approval
and exact first-run action into the active prompt and canonical audit before
running Brev. Record the required research escalation and selected command
shape in a receipt, then let the next slice spend from the now-aligned envelope.

## examples

- campaign token: `m3jb_research_guided_landmark_pck_exploration_campaign_brev_ok`
- first-run token: `m3jb_landmark_pck_run1_w96_g48_fulltrain_brev_ok`
- selected run: width `96`, heatmap grid `48`, full train split, no
  destructive train-quality filter
- fallback research route: `openai-api-research` / `gpt-5.5` after `iab`
  browser backend was unavailable

## linked files

- `GOAL.md`
- `docs/model/return-to-form-m3jb-hierarchical-hand-state-tracker-goal-loop-prompt.md`
- `docs/validation/return-to-form-m3jb-landmark-pck-campaign-research-plan-v1.json`
- `artifacts/research/m3jb-landmark-pck-campaign-905/response.md`
- `docs/session-logs/905-mission-3jb-landmark-pck-campaign-research-plan.md`

# 77. Separate training approval from infrastructure repair approval

date: 2026-06-03
source slice: docs/session-logs/918-mission-3jb-recognizer-brev-worker-health-refresh.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

M3JB had current human approval for an unconstrained recognizer Brev training
campaign, but the active prompt also forbade deleting, resetting, repairing, or
creating Brev infrastructure without explicit human approval.

## gotcha / pattern

An approved training envelope does not imply permission to mutate the cloud
infrastructure when every existing worker is unhealthy. Treat "run on a healthy
worker" and "repair/create a worker" as separate authorization surfaces.

## rule

When `brev ls --json` shows no healthy existing NVIDIA worker, record a
read-only health refresh and stop. Retry training only when an already existing
worker is healthy and remote SSH/CUDA preflight passes, or after explicit human
approval for the required infrastructure action.

## examples

- retained worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` =
  `UNHEALTHY` / `READY` / `UNHEALTHY`
- other existing worker: `asl-pilot-m3jb-pairrank-l40s-001` / `h15cj91es` =
  `STOPPED` / `NOT READY` / `UNHEALTHY`
- blocked action class: Brev infrastructure create/delete/reset/repair

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-brev-worker-health-refresh-v1.json`
- `docs/session-logs/918-mission-3jb-recognizer-brev-worker-health-refresh.md`

# 78. Treat recovered learning as tuning evidence, not promotion

date: 2026-06-03
source slice: docs/session-logs/919-mission-3jb-recognizer-transformer-fulltrain-run2-lowlr.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-model-card`

## context

M3JB reran the Transformer recognizer fulltrain with the same run1 shape but a
lower learning rate (`5e-4`) after local tiny-overfit diagnostics isolated the
run1 collapse to optimization.

## gotcha / pattern

A run can clearly learn and still miss the product gate. In run2, monitor top-1
rose to `0.3497` and final loss fell to `0.2224`, but verification
recall@FAR10 was only `0.686`, below the `>=0.85` target and slightly below the
GRU verification baseline of about `0.7`.

## rule

When a recovered fulltrain improves learning dynamics but misses the primary
verification metric, keep browser/runtime fail-closed and route to
research-guided tuning before the next paid run. Do not promote or relabel the
model as MVP-ready based on top-1 movement alone.

## examples

- run: `m3jb-recognizer-transformer-run2-lowlr-fulltrain-e200-lr5e4-brev-v1`
- test top-1: `0.2609`
- test top-5: `0.5635`
- verification recall@FAR10: `0.686`

## linked files

- `docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run2-lowlr-brev-v1.json`
- `docs/session-logs/919-mission-3jb-recognizer-transformer-fulltrain-run2-lowlr.md`

# 64. Batch homogeneous crop-review bookkeeping after redirect

date: 2026-06-02
source slice: docs/session-logs/893-mission-3jb-test-11590-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB began another diagnostic-row review at `test:11590`, but a
reviewer redirect landed during the slice: row-by-row crop-review commits were
forbidden because they were not rebuilding the cache, retraining, or changing
PCK.

## gotcha / pattern

Homogeneous frame-edge/OOB bookkeeping can look productive while preserving the
same model state. Once the policy is clear, repeating one-row commits adds
review artifacts but does not answer the demo question. The useful proof is the
metric after rebuilding the crop cache and retraining the landmark student.

## rule

Batch homogeneous frame-edge/OOB dispositions into one ledger update, then move
to the measured lever: cache rebuild, scratch landmark retrain, and held-out
PCK re-measurement. Do not resume per-row commits unless a new policy question
requires human source review.

## examples

- `test:11590`
- `explicit_exclusions: 64`
- `pending_review: 0`
- `cache_rebuild_allowed: 0`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/893-mission-3jb-test-11590-exclusion.md`

# 63. Exclude clip-end lower-edge partial hand rows

date: 2026-06-02
source slice: docs/session-logs/892-mission-3jb-test-10866-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `shoe` where the requested
right/second hand sat at the lower edge near the end of the source clip.

## gotcha / pattern

Packet windows can extend past the real clip end. For `test:10866`, the packet
requested frames `57-61`, but `ffprobe` reported only `60` frames, so the actual
source review window was frames `57-59`. The teacher box stayed bottom-pinned
and the lower hand geometry remained cut off across the available frames.

## rule

When a clip-end source window is truncated and the requested hand remains
bottom-pinned with partial hand/forearm geometry, record an explicit
frame-edge/OOB exclusion. Do not infer a cache-safe replacement from a requested
packet frame range that is not present in the video.

## examples

- `test:10866`
- `frame_indices_reviewed: [57, 58, 59]`
- `teacher_box_full_frame: [0.568197, 0.803944, 0.803138, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/892-mission-3jb-test-10866-exclusion.md`

# 62. Reject bottom-pinned motion-blur hand crops

date: 2026-06-02
source slice: docs/session-logs/891-mission-3jb-test-10569-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `please` where the requested
right/second hand moved through the lower frame edge across frames `13-17`.

## gotcha / pattern

A bottom-pinned crop can include a recognizable sign motion but still only
capture blurred partial hand or forearm/torso context. That is not enough for a
21-landmark target because the missing lower geometry becomes hidden label
noise.

## rule

When the selected crop is bottom-pinned and the reviewed source window shows
blurred partial hand motion rather than complete requested-hand geometry,
record an explicit frame-edge/OOB exclusion. Do not authorize cache rebuild
from motion plausibility alone.

## examples

- `test:10569`
- `frame_indices_reviewed: [13, 14, 15, 16, 17]`
- `teacher_box_full_frame: [0.465296, 0.799494, 0.74541, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/891-mission-3jb-test-10569-exclusion.md`

# 61. Exclude clip-start forearm-dominant bottom crops

date: 2026-06-02
source slice: docs/session-logs/890-mission-3jb-test-11228-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `tomorrow` at clip start. The
teacher box was pinned to the lower source boundary across frames `0-2` and
covered mostly forearm/lower-hand context.

## gotcha / pattern

Clip-start rows can show the signer and intended arm clearly while the actual
hand remains incomplete. A forearm-dominant bottom crop is not enough evidence
for 21-landmark supervision, even when the sign target is visually plausible.

## rule

Do not create replacement labels from bottom-pinned clip-start crops unless the
complete requested hand is in-frame across the reviewed window. Record an
explicit frame-edge/OOB exclusion and keep cache rebuild blocked.

## examples

- `test:11228`
- `frame_indices_reviewed: [0, 1, 2]`
- `teacher_box_full_frame: [0.076399, 0.806864, 0.329284, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/890-mission-3jb-test-11228-exclusion.md`

# 55. Frame-0 animal setup clips still need exclusion

date: 2026-06-02
source slice: docs/session-logs/884-mission-3jb-test-7479-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row for `animal` at the start of the
clip. The requested left/first hand was visible in frames `0-2`, but the
teacher box stayed pinned to the bottom source-frame boundary.

## gotcha / pattern

Start-of-clip setup frames can show a stable, recognizable hand pose while
still missing the lower hand geometry. For a 21-landmark student, that is not a
safe replacement label because the model would learn from incomplete source
geometry.

## rule

Keep frame-0 setup rows fail-closed when the requested hand remains clipped at
the lower source edge across the available packet window. Record an explicit
frame-edge/OOB exclusion unless a reviewed source window shows the full hand
in-frame.

## examples

- `test:7479`
- `frame_indices_reviewed: [0, 1, 2]`
- `teacher_box_full_frame: [0.11911, 0.850499, 0.26803, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/884-mission-3jb-test-7479-exclusion.md`

# 54. Exclude lower-edge hand boxes even when the palm is visible

date: 2026-06-02
source slice: docs/session-logs/883-mission-3jb-test-9777-exclusion.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

Mission 3JB reviewed a diagnostic test row where the requested left/first hand
was visibly present and easy to identify, but the teacher box still touched the
bottom source-frame boundary across the five-frame window.

## gotcha / pattern

Visible palm and finger structure can make a row look tempting as a replacement
label. For landmark supervision, the key question is whether the full hand
geometry is in-frame. If the crop is bottom-pinned, fingertips or lower contour
may be truncated even when most of the hand is visible.

## rule

Do not turn a recognizable but bottom-pinned hand into a cache-safe replacement.
For clearer-source review rows, require full in-frame hand geometry before
authorizing landmark cache rebuild; otherwise record an explicit frame-edge/OOB
exclusion.

## examples

- `test:9777`
- `frame_indices_reviewed: [11, 12, 13, 14, 15]`
- `teacher_box_full_frame: [0.21821, 0.798518, 0.4075, 1]`

## linked files

- `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`
- `docs/session-logs/883-mission-3jb-test-9777-exclusion.md`

# 84. Check the cheap leading indicator before spending compute on the wrong axis

date: 2026-06-10
source slice: docs/session-logs/962-mission-3jb-recognizer-run10-simccw48-gate-pass.md
source task: `MVP_TASKS.md#task-026`
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-no-pretrained`

## context

After the ws1 width-48 SimCC student plateaued at held-out PCK@0.10 ~0.676, its
own receipt recommended an LR-schedule fix (cosine) as "the cheapest win." Two
more overnight MPS runs followed (v2 cosine/200 early-stopped before decay
engaged; v3 cosine/100 no early stop). All three — constant LR, truncated
cosine, full cosine — landed test PCK 0.673-0.676 while train PCK climbed to
0.82-0.87. The schedule was never the lever; the large train-minus-test gap
(~0.15-0.21) was already shouting "data/regularization-bound," and that signal
was visible in the v1 receipt before any second run was launched.

## gotcha / pattern

A plateau invites schedule/optimizer tinkering because that is the easiest knob
to turn. But the train-vs-held-out gap is a near-free diagnostic that tells you
which axis is actually binding: a SMALL gap at a low plateau means under-fitting
(capacity/schedule/optimization); a LARGE gap means over-fitting (data volume,
regularization, augmentation). Tuning the wrong axis costs hours of GPU/MPS and
returns nothing — the exact failure this repo's "don't artificially handicap on
compute, but don't waste it either" posture is meant to avoid.

## rule

Before launching any ablation/tuning run, read the cheap leading indicator that
would tell you if you are tuning the wrong axis, and gate the expensive run on
it:
- Large train-minus-held-out gap at a plateau -> attack DATA/REGULARIZATION
  (more labels, augmentation, weight decay), NOT schedule/LR/capacity.
- Gate any expensive DOWNSTREAM step (re-extraction, Brev retrain, deploy) on a
  cheap UPSTREAM leading indicator clearing a pre-committed threshold. Do not
  re-extract + retrain on a new student unless its held-out metric actually beat
  the incumbent first.
- One controlled run to test a hypothesis is fine; a SECOND run on the same axis
  after the first showed no movement is the smell. Stop and re-read the
  diagnostic instead.

## examples

- v1 constant-lr: val PCK 0.625 / test 0.676 / train 0.82
- v2 cosine-200 (early-stopped epoch 82, decay never engaged): test 0.674
- v3 cosine-100 (no early stop): test 0.673 / train 0.866 -> gap 0.19
- next lever (correct axis): interior-frame label scaling 30k -> 60-100k hands

## linked files

- `tools/detector0-annotator/output/ws1-simcc-w48-schedule-ablation-v1.json` (annotator commit 85a19f83)
- `docs/session-logs/962-mission-3jb-recognizer-run10-simccw48-gate-pass.md`
