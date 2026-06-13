---
name: observer-prompt-authoring
description: Use when creating or refining Markdown prompts for future observational critic agents that evaluate a running goal-loop process and provide concise steering feedback without taking over implementation.
---

# Observer Prompt Authoring Skill

## Purpose

Create a Markdown prompt file for a future observational critic agent.

The file should help that future observer evaluate a running goal-loop process and provide concise steering feedback.

## Output

Create a Markdown file named according to the process being observed, such as:

`observer_prompt.md`

The file should be concise, practical, and easy to apply repeatedly during a long-running process.

## Core Principles

The generated observer prompt should help the future observer evaluate:

- alignment with the user's intent;
- fidelity to the source-of-truth artifacts;
- progress against acceptance criteria;
- quality of evidence;
- whether the process is productively moving toward completion.

The observer's role is to evaluate and steer, not to take over the implementation.

## Recommended File Structure

The generated Markdown prompt should include:

### Observation Mission

State what process the observer is watching and what kind of feedback it should provide.

### Source-of-Truth Chain

List the hierarchy the observer should use when judging the worker's progress.

Example:

```text
user intent
-> constitution.md
-> spec.md
-> plan.md
-> tasks.md
-> goal_loop_prompt.md
-> worker transcript
-> implementation evidence
```

### Acceptance Criteria

List the completion conditions the observer should measure against.

Keep them concrete enough that the observer can mark each one as satisfied, partially satisfied, blocked, or not yet addressed.

### Evidence Standard

Describe what evidence counts as meaningful progress.

Examples:

- inspected files or source-of-truth artifacts;
- changed files and why they matter;
- test, build, lint, or script output;
- screenshots, generated artifacts, logs, or diffs;
- explicit blocker descriptions and attempted recovery steps.

### Observer Checks

Give the observer a compact checklist:

1. Is the worker following the source-of-truth chain?
2. Is the worker solving the stated goal rather than a nearby goal?
3. Is the next step small, useful, and evidence-producing?
4. Are assumptions clearly labeled?
5. Are risks, regressions, or missing validation being surfaced early?
6. Is the worker preserving unrelated user or worktree changes?
7. Is the process still making meaningful progress toward completion?

### Feedback Format

Define a short response shape the observer can reuse.

Example:

```text
Status:
What looks aligned:
Concern:
Suggested steering:
Evidence to request next:
```

For normal observations, prefer one clear steering point over a long review.

### Escalation Guidance

Describe when the observer should be more direct.

Use stronger feedback when the worker is drifting from user intent, treating weak evidence as completion, ignoring source-of-truth artifacts, skipping required validation, risking unrelated changes, or repeating the same blocked action without new information.

## Tone

The observer should be concise, specific, and grounded in evidence. Feedback should help the worker course-correct while keeping momentum.
