# Return-To-Form Tier 0 Crop Normalization Ablation Design Goal Loop Prompt

Mission 3AE-Q prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write the smallest useful **design-only** crop-normalization ablation plan after
the local Detector 0 smoke proved packet/tensor/target/loss/metric wiring. This
slice defines what a fixed-crop versus detector-normalized comparison would run
and how it would be judged. It must not implement or run the ablation.

The design must remain local/no-spend. `brev ls --json` is allowed only as a
read-only status check because the user said they will stop the existing
worker.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-Q.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-Q in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-P smoke report:
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json).
5. M3AE-L bootstrap report:
   [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json).
6. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
7. M3AE-J/K fixed-crop recognizer evidence.
8. M3AC/M3AD fixed-crop, gate, source, manifest, and dataloader artifacts.
9. Source register:
   [`docs/model/dataset-source-register.json`](dataset-source-register.json).

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/research/return-to-form-tier0-source-coverage.json \
  docs/model/return-to-form-fixed-crop-config.json \
  docs/validation/return-to-form-tier0-gates.json \
  docs/validation/return-to-form-tier0-decode-dataloader.json \
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json \
  docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one design slice:

1. Preserve the M3AE-P smoke as proof of Detector 0 packet/loss/metric wiring,
   not as detector quality proof.
2. Define the fixed-crop baseline and detector-normalized candidate using only
   existing approved Tier 0 manifests, tensors, packet rows, and manual or
   manual-corrected boxes.
3. Specify the crop-normalization transform inputs/outputs, coordinate
   convention, frame selection, split handling, expected retained artifacts,
   and hash bindings.
4. Specify metrics and pass/fail gates for the ablation design: recognizer
   train sanity, validation signal, detector localization sanity, hard-negative
   blocker separation, and no-zero-accepted-true-class blocker separation.
5. Write
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md)
   with source artifacts, planned commands or command templates, expected
   outputs, no-pretrained/source boundaries, Brev no-spend boundary,
   final-promotion blocker separation, stop rules, risks, and exactly one next
   action.
6. Update the Mutable Tactical Overlay with the design artifact and exactly one
   next action.
7. Write a numbered session log.

If the design cannot justify a bounded no-new-source ablation, do not force a
training run. Record the blocker and select the appropriate next action.

## Next-Action Choices

Choose exactly one next action in the design artifact:

- `crop_normalization_ablation_smoke`: use only if the design is bounded,
  local/no-spend, source-approved, no-pretrained, and ready for one small
  implementation-and-run slice.
- `detector0_data_or_target_remediation`: use if the design finds the 15-row
  packet or target schema is insufficient before any ablation.
- `crop_normalization_design_continue`: use if more design evidence is needed
  before deciding whether to run the ablation.
- `stop_reduced_claim`: use when no bounded no-new-source crop-normalization
  path is justified without human sign/data review, Brev spend, new source
  approval, or a changed product claim.

## Hard Boundaries

- Do not implement or run the crop-normalization ablation in this slice.
- Do not train or retrain the recognizer.
- Do not train Detector 0 again.
- Do not run another classifier microprobe or broad smoke.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, or pretrained-generated
  labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-Q.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The design consumes only approved packet rows, approved Tier 0 manifests,
   existing tensor paths, and manual/manual-corrected box evidence, with no
   source import, no pretrained detector/landmark/feature dependency, and no
   Brev compute.
6. The design artifact exists at
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md)
   and records source artifacts, fixed-crop baseline, detector-normalized
   candidate, dataset rows/splits, metrics, stop rules, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion negative-challenge blocker
   separation, readiness classification, and exactly one next action.
7. The Mutable Tactical Overlay links to the design artifact and records exactly
   one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet/smoke hashes, design artifact hash, Brev worker
   status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
9. No Brev sync/training/spend, recognizer training, Detector 0 retraining,
   crop-normalization ablation run, label expansion, controlled clip-heldout
   evaluation, source approval, unapproved media import, ONNX export,
   model-card promotion, final-readiness claim, broad-run redirect, Brev stop,
   duplicate Brev worker, final-gate weakening, pretrained detector/landmark
   use, implementation-code change, or push occurs.

When all nine are true, continue the goal loop according to the design
artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-Q crop-normalization ablation design.
Completed:            <design artifact or exact no-spend/design blocker>.
Evidence:             <artifact paths, hashes, source/boundary checks, and audit statuses>.
Remaining:            <single next action from the design artifact>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
