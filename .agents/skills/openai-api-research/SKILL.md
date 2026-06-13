---
name: openai-api-research
description: Use when the user explicitly asks to use the OpenAI API for programmable research, synthesis, critique, extraction, batch analysis, or long-context reasoning from local artifacts or user-approved source material. Prefer this over ChatGPT.com Pro when the task needs repeatable API calls, structured outputs, saved prompts, local files, automation, or integration into scripts.
---

# OpenAI API Research

Use this skill when the user wants Codex to use the OpenAI API as a programmable research collaborator. This is different from the `gpt-pro-research` skill, which uses ChatGPT.com through the browser.

## Credential

The global API key file is:

```bash
/Users/kelly/.codex/secrets/openai-api.env
```

It should contain:

```bash
OPENAI_API_KEY=sk-...
```

Before any API call:

1. Check for the key without printing it:
   ```bash
   test -f /Users/kelly/.codex/secrets/openai-api.env && grep -q '^OPENAI_API_KEY=sk-' /Users/kelly/.codex/secrets/openai-api.env
   ```
2. Source it only inside the command that needs it:
   ```bash
   set -a
   source /Users/kelly/.codex/secrets/openai-api.env
   set +a
   ```
3. Never echo, cat, log, summarize, or paste the key value. If the key is missing, ask the user to add it to the file above.

## When To Use The API

Good fits:

- The user explicitly asks to use the OpenAI API, an API model, or this skill.
- Repeatable research runs where prompts, inputs, and outputs should be saved.
- Batch synthesis across many local files, notes, transcripts, search results, or papers.
- Structured extraction, scoring, ranking, critique, or eval-style comparison.
- Long reasoning over user-approved local artifacts when normal inline analysis would be too cramped.
- Producing machine-readable JSON, tables, checklists, or decision memos from supplied evidence.

Avoid API calls when:

- A direct Codex answer is enough.
- The task requires current web facts and no source-gathering path has been approved.
- The data includes secrets, credentials, private keys, medical/legal/financial personal details, or sensitive third-party material the user has not explicitly approved sending.
- The user asked for ChatGPT.com Pro / Extended Pro. Use `gpt-pro-research` for that.

## Source Discipline

The API is a reasoning and synthesis tool, not proof by itself.

- Gather source material first with local files, official docs, primary sources, or user-approved web searches.
- Ask the model to separate evidence from inference.
- Preserve links, filenames, line numbers, or document titles in the prompt when available.
- Verify high-stakes, current, legal, medical, financial, security, or implementation-critical claims against primary sources.
- Treat model output as a draft analysis until Codex checks it against the underlying evidence.

## Prompt Strategy

Use one explicit prompt per research pass. Include:

- Task: the exact question or decision to resolve.
- Context: short local facts the model needs.
- Evidence: pasted excerpts, source links, filenames, or summarized search results.
- Constraints: what must not be assumed, disclosed, or changed.
- Output shape: memo, JSON schema, ranked list, comparison table, findings, or implementation plan.
- Verification ask: require the model to mark unsupported claims and uncertainty.

Default research prompt shape:

```text
You are a research assistant helping Codex with a local engineering task.

Question:
[exact question]

Context:
[brief non-sensitive project context]

Evidence:
[source excerpts, links, file references, or summarized findings]

Instructions:
- Distinguish cited evidence from your synthesis.
- State assumptions and uncertainty explicitly.
- Prefer practical recommendations over broad background.
- Do not invent source claims.
- Return [requested format].
```

## API Pattern

Prefer the Responses API for new work. Use the official OpenAI docs if exact parameters, model names, tools, or SDK calls matter for the current task.

Minimal shell pattern:

```bash
set -a
source /Users/kelly/.codex/secrets/openai-api.env
set +a

curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d @request.json
```

Keep request payloads in temporary or task-local files when useful for reproducibility. Do not store sensitive user data in persistent files unless the user approved that storage.

## Output Handling

- Save large raw API responses only when the user asked for an artifact or the run needs auditability.
- Summarize back to the user in Codex's own words.
- Clearly label what came from API synthesis versus what Codex independently verified.
- Include source links or local file references used as evidence.
- Mention cost/time tradeoffs if running repeated or large-context calls.
