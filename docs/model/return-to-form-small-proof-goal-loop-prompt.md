# Return-To-Form Small-Proof Goal Loop Prompt

Mission 3AC prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Choose and document the first 5-sign fixed-crop learnability proof. This mission
does not train a model. It prepares the source, crop, and validation gates so
the next training slice is predictable and reviewable.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AC.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AC in the Milestone Ladder.
4. [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   and [`docs/model/dataset-source-register.md`](dataset-source-register.md).
5. Current manifests under `data/manifests/` and source summaries under
   `docs/validation/`.

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
```

Then choose the smallest 5-sign Tier 0 proof set from already approved raw-video
sources. Prefer signs with:

- clear visual separation from each other;
- enough approved raw-video clips in train/validation/test or an honestly
  documented split limitation;
- compatibility with fixed controlled crops;
- no dependency on live phonology or detector evidence.

Write the following artifacts:

1. `docs/research/return-to-form-tier0-source-coverage.json`
   - selected labels;
   - source ids;
   - clip counts by split;
   - signer/split limitation notes;
   - source-register hash;
   - optional phonology-coverage status.
2. `docs/model/return-to-form-fixed-crop-config.json`
   - frame size assumption;
   - left-hand region;
   - right-hand region;
   - signing-space or upper-body region;
   - optional head region;
   - limitation text for controlled framing.
3. `docs/validation/return-to-form-tier0-gates.json`
   - pre-written training sanity gate;
   - validation target;
   - hard-negative FAR target;
   - no-zero-accepted-true-class rule;
   - explicit non-goals and stop rules.

Update the Mutable Tactical Overlay in
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with links to the
three artifacts.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AC.
2. `node scripts/audit_return_to_form_plan.mjs --json` exits 0.
3. `docs/research/return-to-form-tier0-source-coverage.json` exists and names a
   5-sign Tier 0 set with source ids and coverage counts.
4. `docs/model/return-to-form-fixed-crop-config.json` exists and documents the
   fixed controlled-crop protocol.
5. `docs/validation/return-to-form-tier0-gates.json` exists and sets gates
   before training.
6. The Mutable Tactical Overlay in `return-to-form-plan.md` links to those
   artifacts and says M3AD is the next milestone.
7. A numbered session log records selected signs, source/crop/gate evidence,
   validation commands, and the next action.
8. No training, controlled clip-heldout evaluation, source approval, media
   import, ONNX export, model-card promotion, final-readiness claim, broad-run
   redirect, Brev stop, or push occurs.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AC small-proof selection and gates.
Completed:            <selected signs, source coverage, crop config, gates>.
Evidence:             <artifact paths and audit statuses>.
Remaining:            M3AD decode and dataloader proof.
Blockers:             <none, or exact coverage/crop/source blocker>.
Next step:            Generate Tier 0 manifests/tensors and prove dataloader before training.
Checkpoint commit:    <commit hash>.
```

