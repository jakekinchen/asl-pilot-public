# Rawframe Approved External Route Scaling Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this external route scaling prompt unless the user explicitly
approves a redirect away from the return-to-form milestone ladder.

Mission 3W prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after Mission 3V corrected the erroneous
browser-capture route and refreshed the source/model audits at `34def80`.

## Mission

Move the active rawframe model path from status reporting into the next
source-register-safe online/external raw-video evidence step.

The goal is not to retry PopSign-only training, activate browser-capture
collection, or claim final promotion. The goal is to inspect the already
approved/imported ASL Citizen and WLASL school-assignment raw-video artifacts,
then commit the smallest source-bound readiness or manifest evidence that makes
the next controlled training step possible. If the repo cannot safely produce
that evidence yet, write the exact blocker and next command instead.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3W.
3. [`docs/session-logs/169-mission-3v-non-first-party-route-status.md`](../session-logs/169-mission-3v-non-first-party-route-status.md).
4. Current Mission 3V audit outputs:
   - [`docs/validation/controlled-pilot-source-remediation-status.json`](../validation/controlled-pilot-source-remediation-status.json)
   - [`docs/validation/controlled-pilot-model-strategy-triage.json`](../validation/controlled-pilot-model-strategy-triage.json)
   - [`docs/research/nvidia-asl-metadata-audit.json`](../research/nvidia-asl-metadata-audit.json)
5. Source-register decisions:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - Use only the exact approved school-assignment raw-video source ids:
     `asl-citizen-school-assignment-raw-videos` and
     `wlasl-school-assignment-raw-videos`.
   - Do not use the broad disallowed `asl-citizen` or `wlasl` source ids.
6. Existing selected raw-video evidence:
   - [`docs/research/asl-citizen-selected-raw-clip-import.json`](../research/asl-citizen-selected-raw-clip-import.json)
   - [`docs/research/wlasl-academic-selected-raw-clip-import.json`](../research/wlasl-academic-selected-raw-clip-import.json)
   - [`docs/validation/asl-citizen-selected-manifests.json`](../validation/asl-citizen-selected-manifests.json)
7. Relevant existing scripts. Discover them with `rg` before editing or
   running anything:
   - `rg "asl-citizen-selected|wlasl-academic|selected-manifest|selected_raw" scripts docs -g '*.mjs' -g '*.json' -g '*.md'`

## First Reviewable Slice

Run the orientation checks first:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
git diff --check
brev ls --json
```

Then inspect the source-bound selected-clip artifacts and existing scripts.
Prefer the smallest evidence-producing step in this order:

1. If the repo already has a safe WLASL selected-manifest/readiness exporter,
   run it in the documented write mode, validate the output, and commit the
   resulting source-bound artifact plus a numbered session log.
2. If only an ASL Citizen selected-manifest path is currently safe, refresh its
   existing readiness artifact only when that refresh is necessary for the next
   route decision; otherwise leave it unchanged and explain why.
3. If no safe exporter or readiness path exists, write a numbered session log
   naming the exact file/script gap, the source-register decision id that would
   be used, and the next command or implementation slice the executor should
   perform next.

Keep the slice narrow. Do not combine source-readiness work with decode,
training, ONNX export, model-card updates, or final validation.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and `node scripts/audit_loop_premise.mjs --json` exits 0.
2. `node scripts/audit_source_register.mjs` exits 0.
3. The executor records the current approved external raw-video route status,
   including the exact source ids and whether ASL Citizen/WLASL selected
   readiness evidence is present.
4. One of these is committed:
   - a refreshed source-bound readiness/manifest artifact for already
     approved/imported ASL Citizen or WLASL selected clips, with validation
     evidence in the session log; or
   - a numbered session log that identifies the exact blocker and next command
     needed to produce that artifact.
5. Brev worker status and the manual stop command remain explicit:
   `brev stop asl-pilot-rawframe-001`.
6. No prohibited work occurs in this slice.

## Hard Limits

- Do not run browser-capture collection commands.
- Do not create, import, or commit unapproved media.
- Do not change source-register approvals in this slice.
- Do not train a model, export ONNX, promote a model card, or weaken final
  gates.
- Do not stop the Brev worker; the user said they will stop it when done.
- Do not treat NVIDIA ASL / ASL 1000 as ready unless accepted access receipt
  evidence and metadata-only staging evidence exist.
- Do not use broad disallowed source ids when a source-bound school-assignment
  id is required.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3W approved external raw-video route scaling.
Completed:            <smallest committed evidence or exact blocker>.
Evidence:             <commands, artifacts, source ids, and commit>.
Remaining:            <next source-bound readiness/decode/training-readiness step>.
Blockers:             <none, or exact source/tool/access blocker>.
Next step:            <one concrete executor action>.
Checkpoint commit:    <commit hash>.
```
