---
name: goal-builder
description: Use when creating or refining durable Markdown prompts for future Codex goal loops, including source-of-truth ordering, acceptance criteria, evidence standards, execution rhythm, and progress ledgers.
---

# Goal Loop Prompt Authoring Skill

## Purpose

Create a Markdown prompt file for a future goal-loop agent.

The file should help that future agent execute a task autonomously while staying aligned with the user’s intent, source-of-truth artifacts, and acceptance criteria.

## Output

Create a Markdown file named according to the task, such as:

`goal_loop_prompt.md`

The file should be concise, durable, and easy for another agent to follow.

## Core Principles

The generated prompt should make the future agent’s work:

- goal-directed;
- spec-bound;
- evidence-backed;
- easy to evaluate;
- appropriately bounded for the cost of being wrong.

Use the lightest structure that is sufficient for the task.

For small, reversible work, create a lightweight prompt.

For unattended, long-lived, multi-person, or hard-to-undo work, create a more explicit prompt with source-of-truth artifacts, acceptance criteria, and a progress ledger.

## Recommended File Structure

The generated Markdown prompt should include:

### Mission

State the future agent’s task in one short paragraph.

### Source of Truth

List the materials the future agent should treat as authoritative.

Examples:

- user request;
- constitution.md;
- spec.md;
- plan.md;
- tasks.md;
- existing repo conventions;
- provided screenshots, docs, or tickets.

When there are multiple artifacts, order them by authority.

### Intended Outcome

Describe the finished world-state.

This should be about the result, not the activity.

### Acceptance Criteria

List the conditions that must be true for the task to count as complete.

Each criterion should be concrete enough that another agent or human can evaluate it.

### Evidence Standard

Describe what the future agent should surface before claiming completion.

Examples:

- changed files;
- completed tasks;
- command output;
- test results;
- screenshots;
- generated artifacts;
- final diff summary;
- unresolved blockers.

### Decision Status

Separate:

- confirmed requirements;
- assumptions;
- recommended defaults;
- open questions.

This keeps the prompt from turning guesses into requirements.

### Execution Rhythm

Give the future agent a simple loop:

1. inspect the current state;
2. choose the next smallest useful step;
3. act;
4. record evidence;
5. compare progress against acceptance criteria;
6. continue until the completion condition is met.

### Progress Ledger

Define a compact status format.

Example:

```text
Current state:
Completed:
Evidence:
Remaining:
Blockers:
Next step:
