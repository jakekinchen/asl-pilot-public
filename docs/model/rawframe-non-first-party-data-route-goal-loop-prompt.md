# Raw-Frame Non-First-Party Data Route Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this non-first-party route prompt unless the user explicitly
approves a redirect away from the return-to-form milestone ladder.

Mission 3V prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after the user corrected the prior Mission 3V redirect:
the active plan is not to gather new browser-capture data.

## Mission

Repair the first-party collection misroute and move the raw-frame model goal to
the next non-first-party evidence path after the PopSign-only training runs
failed quality gates.

The goal is not another model-only rerun and not collection-mode activation. The
goal is to use current source-register and validation evidence to select the next
defensible online/external raw-video path, or to record that a reduced-scope
pilot decision is now required before more training.

## Source Of Truth

Authority order:

1. Latest user instruction: we are not getting new first-party browser-capture
   data for this active plan.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3V.
3. [`docs/session-logs/168-correct-first-party-misroute.md`](../session-logs/168-correct-first-party-misroute.md).
4. Mission 3T and 3U evidence:
   - [`docs/session-logs/165-mission-3t-training-quality-recovery.md`](../session-logs/165-mission-3t-training-quality-recovery.md)
   - [`docs/session-logs/166-mission-3u-nvidia-access-audit.md`](../session-logs/166-mission-3u-nvidia-access-audit.md)
   - [`docs/validation/rawframe-training-quality-recovery-diagnostic.json`](../validation/rawframe-training-quality-recovery-diagnostic.json)
   - [`docs/validation/rawframe-data-remediation-plan.json`](../validation/rawframe-data-remediation-plan.json)
   - [`docs/research/nvidia-asl-metadata-audit.json`](../research/nvidia-asl-metadata-audit.json)
5. Data-route planning and source-register evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/research/rawframe-data-decision.md`](../research/rawframe-data-decision.md)
   - [`docs/research/online-training-dataset-strategy.md`](../research/online-training-dataset-strategy.md)
   - [`docs/model/rawframe-data-decision-goal-loop-prompt.md`](rawframe-data-decision-goal-loop-prompt.md)
   - [`docs/model/rawframe-nvidia-access-goal-loop-prompt.md`](rawframe-nvidia-access-goal-loop-prompt.md)
6. Current recommendation audits:
   - `scripts/audit_controlled_pilot_source_remediation_status.mjs`
   - `scripts/audit_controlled_pilot_model_strategy.mjs`
   - `scripts/audit_nvidia_asl_access_metadata.mjs`
   - `scripts/audit_source_register.mjs`
7. Current manifests, tensors, model artifacts, and browser artifacts under
   `data/`, `artifacts/rawframe-model/`, and `web/public/model/`.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and
   `node scripts/audit_loop_premise.mjs --json` exits 0.
2. The superseded first-party activation prompt is marked as a misroute and is
   not the active per-milestone prompt.
3. The model/source recommendation audits do not turn collection queue readiness
   into an automatic collection recommendation.
4. The refreshed validation artifacts identify the next non-first-party action:
   an approved/approvable online or external raw-video route, NVIDIA access plus
   metadata-only review if evidence appears, or an explicit reduced-scope pilot
   decision.
5. Brev worker status is recorded without stopping the user-kept worker.
6. No collection-mode capture, unapproved media import, manifest export,
   training run, ONNX export, model-card promotion, final claim, or final-gate
   weakening happens in this correction slice.

## First Reviewable Slice

Run:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_controlled_pilot_source_remediation_status.mjs --write
node scripts/audit_controlled_pilot_model_strategy.mjs --write
node scripts/audit_nvidia_asl_access_metadata.mjs --write
node scripts/audit_source_register.mjs
git diff --check
brev ls --json
```

Some audits are fail-closed while source evidence is absent; capture their exact
status and blockers rather than treating a nonzero exit as permission to switch
routes.

Then write a numbered session log and commit the correction.

## Evidence Standard

Surface:

- changed files and generated artifact paths;
- exact files where the first-party misroute was integrated;
- refreshed `recommended_next_action` values;
- source-register status for PopSign, approved external/academic routes, and
  NVIDIA;
- whether the next step is online/external data work, NVIDIA access/metadata, or
  reduced-scope approval;
- Brev worker status and manual stop command;
- commands run and pass/fail status.

## Hard Limits

- Do not start collection-mode capture or ask for a signer session in this
  mission.
- Do not import raw media unless the exact source scope is approved by the source
  register and the import path has a retained rights/provenance review.
- No pretrained CV/sign/landmark/model dependencies.
- No raw learner video upload during normal practice.
- No synthetic clips as training, validation, test, or negative-challenge
  evidence.
- No `git push`.
- No final-gate weakening unless the user explicitly changes the gate in
  writing.
