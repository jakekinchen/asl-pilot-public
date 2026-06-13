# Return-To-Form Tier 0 Detector 0 Union-Target Held-Out Behavior Check Design Prompt

Mission 3AE-AM prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write one **local, no-spend, design-only** held-out behavior check plan for the
M3AE-AL passing train-fit microprobe:

```text
anchor_residual_coordconv_union_target_microprobe_v1
```

M3AE-AL proved the selected formulation can beat the M3AE-AJ median-box baseline
on train. It did not prove held-out behavior: validation/test metrics were
report-only and weak. This mission defines exactly what a later no-training
held-out behavior check must inspect before any crop-normalization ablation,
recognizer training, export, promotion, or product claim.

Do not rerun the microprobe. Do not train.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AM.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AL/M3AE-AM in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AL architecture-microprobe receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json).
5. M3AE-AL session log:
   [`docs/session-logs/254-return-to-form-tier0-detector0-union-target-architecture-microprobe.md`](../session-logs/254-return-to-form-tier0-detector0-union-target-architecture-microprobe.md).
6. M3AE-AK architecture design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md).
7. M3AE-AJ median-baseline diagnostic receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json).
8. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
9. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
10. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
11. Source register:
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
jq empty docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one design-only slice:

1. Preserve M3AE-AL as a train-fit success only. It is not held-out proof and
   not product-readiness evidence.
2. Bind the design to M3AE-AL row-level predictions and split metrics. Do not
   rerun the microprobe or train another model.
3. Explicitly carry forward the weak held-out evidence:
   validation presence accuracy `0.27272728085517883`, validation present-box
   MAE `0.08475374430418015`, test presence accuracy `0.4000000059604645`,
   and test present-box MAE `0.09988119453191757`.
4. Define the future no-training held-out behavior check: row-level questions,
   split metrics, median-baseline comparisons, false-positive/false-negative
   accounting, per-sign or table-vs-non-table slices, threshold handling, and
   stop rules.
5. State what evidence would justify a later crop-normalization ablation design,
   and what evidence would instead force architecture, data/schema, or reduced
   claim remediation.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md)
   with design constraints, required inputs, planned checks, pass/fail gates,
   stop rules, no-training/no-pretrained/source boundaries, Brev no-spend
   boundary, final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the design artifact and exactly one
   next action.
8. Write a numbered session log.

## Required Design Content

The design artifact must answer:

- Which M3AE-AL row-level prediction fields are sufficient for the future check?
- Which held-out rows drive false positives, false negatives, and high box error?
- Does the microprobe beat or lose to the M3AE-AJ median box on validation/test
  present-box MAE and IoU?
- What minimum held-out behavior would be needed before any ablation design?
- What stop condition sends the lane back to architecture or data/schema
  remediation?
- How are no-pretrained, source, Brev, final-promotion, and product-runtime
  boundaries preserved?

## Next-Action Choices

Choose exactly one next action in the design artifact:

- `detector0_union_target_heldout_behavior_check`: use when the design defines
  one bounded no-training check that can be run against current M3AE-AL receipt
  evidence and current manifests.
- `detector0_union_target_architecture_remediation`: use when M3AE-AL held-out
  weakness makes a held-out check low-value until architecture/threshold
  behavior is remediated.
- `detector0_union_target_data_or_schema_remediation`: use when the design finds
  a concrete packet, split, target, tensor, or schema problem that invalidates
  the held-out comparison.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

Do not choose crop-normalization ablation, recognizer training, export, or model
promotion directly from this mission.

## Hard Boundaries

- Do not rerun the M3AE-AL microprobe.
- Do not run Detector 0 training or a generic training-smoke retry.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not run crop-normalization ablation in this slice.
- Do not run recognizer training.
- Do not run broad 75/95-label training or evaluation.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not mutate the Detector 0 packet.
- Do not add rows.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AM.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The held-out behavior check design exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md)
   and records train-pass evidence, weak held-out evidence, row-level analysis
   plan, split metrics, median-baseline comparisons, false-positive/
   false-negative accounting, pass/fail gates, stop rules, no-training/
   no-pretrained/source boundaries, Brev no-spend status, final-promotion
   blocker separation, and exactly one next action.
6. The design proves no microprobe rerun, training run, Brev compute, model
   artifact export, model-card promotion, or product claim occurred.
7. The Mutable Tactical Overlay links to the design artifact and records exactly
   one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, M3AE-AJ receipt hash, M3AE-AK design hash,
   M3AE-AL microprobe receipt hash, held-out behavior design artifact path/hash,
   Brev worker status, manual stop command `brev stop asl-pilot-rawframe-001`,
   Brev no-spend boundary, and the next action.
9. No microprobe rerun, Detector 0 training, generic training-smoke retry, Brev
   sync/training/spend, crop-normalization ablation, recognizer training,
   packet mutation, row addition, label expansion, controlled clip-heldout
   evaluation, source approval/import, unapproved media import, ONNX export,
   model-card promotion, final-readiness claim, broad-run redirect, Brev stop,
   duplicate Brev worker, final-gate weakening, product-runtime code change,
   pretrained detector/landmark use, generated pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the design
artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AM Detector 0 union-target held-out behavior check design.
Completed:            <design artifact or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, train-pass and held-out metrics, no-training/Brev boundaries>.
Remaining:            <single next action from the design artifact>.
Blockers:             <none, or exact architecture/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
