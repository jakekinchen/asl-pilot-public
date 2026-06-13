# Brev CLI Reference (for ASL Pilot agents)

This directory is a project-local mirror of the Brev `agent-skill` package. It is here so Codex agents executing the compound engineering plan can read the Brev CLI reference from the repository, since the upstream skill is only installed at the human operator's Claude Code level (`~/.claude/skills/brev-cli/`) and is not visible to Codex Cloud runs.

## When to consult these docs

- Provisioning a GPU instance for any milestone training run (M3 HandBoxNet, M4 baselines, M5 GuidedCropSignNet, ablations).
- Searching available GPU types and prices before launching a job.
- SSH'ing into an instance, copying data/checkpoints, port-forwarding for browser smoke tests.
- Listing, stopping, deleting instances at end-of-day per the compound plan's GPU-stop discipline.
- Building pipeable cleanup commands (`brev ls | awk ... | brev stop`) when running the calendar-fast mode's 2-3 parallel instances.

## Files

- `SKILL.md` — primary usage guide (search, create, shell, exec, open, ls, delete, stop/start, port-forward, copy, organizations).
- `reference/commands.md` — full command reference with pipeable architecture patterns.
- `reference/search-filters.md` — GPU and CPU search filter options.
- `prompts/quick-session.md` — quick GPU session workflow.
- `prompts/ml-training.md` — ML training setup workflow.
- `prompts/cleanup.md` — instance cleanup workflow.
- `examples/common-patterns.md` — common command patterns.
- `INSTALLATION.md` — original install notes from the upstream skill.
- `.version` — upstream commit pin for the mirrored content.

## Cross-references in the compound plan

- `asl_compound_engineering_plan/05_platform_budget_devices.md` — Brev as the primary managed GPU devbox, RTX A5000/4090/L40S sizing, $450 budget allocation.
- `asl_compound_engineering_plan/09_source_notes.md` — links to Brev's official quickstart and GPU catalog URLs.
- `asl_compound_engineering_plan/10_execution_revisions_from_review.md` R7 — GPU stop discipline as part of validation.
- `asl_compound_engineering_plan/11_repo_integration_reconciliation.md` §6 — calendar-fast coordination cost when running 2-3 parallel GPU instances.

## Safety rules (from `SKILL.md`, repeated for emphasis)

Codex agents must NOT do any of the following without explicit human confirmation in the loop:

- Delete instances (`brev delete`).
- Stop running instances (`brev stop`) that belong to another active workstream.
- Create multiple instances (`--count > 1`).
- Create expensive instances (H100, multi-GPU) when a cheaper class meets the workload.

Every GPU job launched from a Codex milestone must record in its run manifest:

- start/end timestamp
- instance type
- estimated cost
- checkpoint path
- validation report path
- sync confirmation

End-of-day checklist (per plan R7) must confirm: "all rented GPUs stopped or intentionally running with owner and expected finish condition."

## Updating this mirror

If the upstream `brev agent-skill` is updated:

```sh
cp -R ~/.claude/skills/brev-cli/. docs/research/platform-docs/brev/
```

The `.version` file records the upstream commit pin at last sync.
