# Rawframe Controlled Clip-Heldout Manifest Refresh Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this controlled clip-heldout prompt unless the user
explicitly approves a redirect away from the return-to-form milestone ladder.

Mission 3X prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after Mission 3W committed source-bound WLASL
selected-manifest readiness at `178e659`.

## Mission

Refresh the controlled clip-heldout training manifests from the current
approved source-bound inputs before launching the next Brev training run.

This is the manifest-sync step in the source-remediation chain:

1. `rerun_manifest_export`
2. `retrain_from_approved_raw_video_only`
3. `rerun_controlled_pilot_validation`
4. `export_and_promote_only_if_validation_passes`

Do not treat this as a blocker. It is the last committed manifest/readiness
sync before the controlled clip-heldout training launch.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3X.
3. [`docs/session-logs/171-mission-3w-wlasl-selected-manifests.md`](../session-logs/171-mission-3w-wlasl-selected-manifests.md).
4. Current selected-manifest summaries:
   - [`docs/validation/wlasl-academic-selected-manifests.json`](../validation/wlasl-academic-selected-manifests.json)
   - [`docs/validation/asl-citizen-selected-manifests.json`](../validation/asl-citizen-selected-manifests.json)
5. Current route/status outputs:
   - [`docs/validation/controlled-pilot-source-remediation-status.json`](../validation/controlled-pilot-source-remediation-status.json)
   - [`docs/validation/controlled-pilot-model-strategy-triage.json`](../validation/controlled-pilot-model-strategy-triage.json)
6. Controlled clip-heldout exporter and summary:
   - `scripts/export_controlled_pilot_clip_heldout_manifests.mjs`
   - [`docs/validation/controlled-pilot-clip-heldout-manifests.json`](../validation/controlled-pilot-clip-heldout-manifests.json)
   - `data/manifests/controlled-pilot-clip-heldout/train.json`
   - `data/manifests/controlled-pilot-clip-heldout/validation.json`
   - `data/manifests/controlled-pilot-clip-heldout/test.json`
7. Source-register decisions:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - Use only source ids approved for this school-assignment raw-video scope.

## First Reviewable Slice

Run exactly this manifest-refresh slice:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/export_controlled_pilot_clip_heldout_manifests.mjs --write --include-wlasl-academic-selected
node scripts/audit_controlled_pilot_source_remediation_status.mjs --write
node scripts/audit_controlled_pilot_model_strategy.mjs --write
git diff --check
brev ls --json
```

Then write a numbered session log and commit only the refreshed manifest
summary/output hashes, refreshed route/status outputs, and the session log.

The session log must include the exact next training command from
[`docs/validation/controlled-pilot-clip-heldout-manifests.json`](../validation/controlled-pilot-clip-heldout-manifests.json)
and state whether `asl-pilot-rawframe-001` is still `RUNNING`, `READY`, and
`HEALTHY`.

Do not train in this slice. If this slice passes, the next mission should start
the controlled clip-heldout Brev training run from the refreshed summary.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and `node scripts/audit_loop_premise.mjs --json` exits 0.
2. `node scripts/audit_source_register.mjs` exits 0.
3. `node scripts/export_controlled_pilot_clip_heldout_manifests.mjs --write --include-wlasl-academic-selected` exits 0.
4. The committed `docs/validation/controlled-pilot-clip-heldout-manifests.json`
   summary has `include_wlasl_academic_selected=true`, points at
   `wlasl-school-assignment-raw-videos`, and records output hashes for train,
   validation, and test manifests.
5. The refreshed source-remediation/model-strategy outputs do not report a
   source-register or manifest blocker. Known untrained/controlled-validation
   blockers are acceptable for this pre-training slice.
6. The session log records Brev worker status, the manual stop command
   `brev stop asl-pilot-rawframe-001`, and the exact next training command.
7. No prohibited work occurs in this slice.

## Hard Limits

- Do not run browser-capture collection commands.
- Do not create, import, or commit unapproved media.
- Do not change source-register approvals.
- Do not train a model in this manifest-refresh slice.
- Do not export ONNX, promote a model card, or weaken final gates.
- Do not stop the Brev worker; the user said they will stop it when done.
- Do not treat this manifest refresh as final promotion evidence. It is a
  controlled-pilot fallback split and is not signer-disjoint final evidence.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3X controlled clip-heldout manifest refresh.
Completed:            <refreshed controlled clip-heldout manifest evidence>.
Evidence:             <commands, artifacts, hashes, Brev status, commit>.
Remaining:            Controlled clip-heldout Brev training launch.
Blockers:             <none, or exact source/manifest/worker blocker>.
Next step:            Start the controlled clip-heldout Brev training command from the refreshed summary.
Checkpoint commit:    <commit hash>.
```
