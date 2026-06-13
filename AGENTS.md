# AGENTS.md

## Project-Local Skill Policy

This repository keeps an allowlisted skill set under `.agents/skills/`.
When working in `/Users/kelly/Developer/asl-pilot`, prefer those local skills
over machine-global skills with the same name or similar purpose.

Codex CLI sessions for this repo should use the local-skills profile:
`codex --profile asl-pilot-local-skills -C /Users/kelly/Developer/asl-pilot`.
The repo Codex loop scripts set this profile by default through `CODEX_PROFILE`.

Do not use a machine-global skill from `~/.codex/skills` for this repo unless
the user explicitly names it or there is no equivalent local skill under
`.agents/skills/`.

The local skill set is intentionally narrow:

- `asl-pilot-codex-pair`
- `asl-pilot-ml-receipt`
- `brev-cli`
- `goal-builder`
- `gpt-pro-research`
- `openai-api-research`
- `observer-prompt-authoring`
- `playwright`
- `hf-cli`
- `huggingface-datasets`
- `huggingface-trackio`
- `incremental-implementation`
- `test-driven-development`
- `debugging-and-error-recovery`
- `code-review-and-quality`
- `documentation-and-adrs`
- `api-and-interface-design`
- `frontend-ui-engineering`
- `browser-testing-with-devtools`
- `security-and-hardening`
- `performance-optimization`

`GOAL.md`, the active prompt under `docs/model/`, `CLAUDE.md`, and the repo
audit chain override copied upstream skill guidance when they conflict.

Project constraints stay binding even when a copied skill suggests otherwise:

- No pretrained CV/sign/landmark/model dependencies in the promoted lane.
- No raw learner video upload during normal practice.
- Heavy GPU training uses Brev only when the active prompt and user approval
  explicitly authorize it.
- Existing `scripts/audit_*.mjs` and repo JSON receipts are the validation
  surface; do not create a parallel audit system.
