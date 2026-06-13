# Handoff RESUME Doc Goal Loop Prompt

Interim mission 3l. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md).

## Mission

Author `docs/handoff/RESUME.md` — a single page consolidating the resume-the-project information that's currently scattered across `docs/session-logs/029-halt-final.md`, `GOAL.md`, the three operator runbooks, and the audit chain. The next person (returning human, ASL reviewer, successor agent) should read this one file FIRST and know exactly where the project stands + what to do next.

## Acceptance Criteria

1. `docs/handoff/RESUME.md` exists and is the single-page tl;dr. Required sections:
   - One-paragraph project status (rawframe-only no-pretrained, model card not_trained, 100 source-curated vocab, 17 structured hint entries, 16 commits of autonomous interim work, mission 3 paused on human action).
   - "What was built" — commit list grouped by mission.
   - "Two human-action gates" — first-party collection + external ASL reviewer; each with one-line pointer to the relevant runbook AND the exact first command.
   - "Resume the loop" — exact sequence (delete sentinel, optional redirect, `/loop /loop-tick`).
   - "Verify repo state" — `bash scripts/preflight.sh`.
2. `README.md` "Operator workflows" section links `docs/handoff/RESUME.md` as the recommended first read.
3. `bash scripts/preflight.sh` exits 0.

## Forbidden Tactics

- No new dependency. No code change. No new audit script.
- Do not duplicate the contents of the runbooks; the handoff doc points AT them.
- Do not invent project facts not already in the durable record.

## Handoff

When all three are met, the autonomous-loop backlog is provably empty. Halt for real (`<stop-orchestrator/>` + session log + no wake signal). If the stop hook re-fires AGAIN despite this, the next iteration ESCALATES to a more honest halt log that names the loop pattern explicitly and asks (via PushNotification) for the human to intervene.
