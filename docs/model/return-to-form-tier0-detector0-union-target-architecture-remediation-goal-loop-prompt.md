# Return-To-Form Tier 0 Detector 0 Union-Target Architecture Remediation Prompt

Mission 3AE-AO prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write one **local, no-spend, design-only** architecture remediation artifact
for the Detector 0 union-target lane.

M3AE-AL proved the selected formulation can fit train. M3AE-AN proved it does
not satisfy held-out presence or box behavior: validation/test false positives
and false negatives remain high, non-table false positives outscore missed
`table` rows, and validation/test MAE and IoU lose to the M3AE-AJ median
baseline. This mission designs the next honest architecture/objective
remediation, or stops, before any further microprobe or ablation.

Do not rerun the microprobe. Do not train. Do not load image or tensor payloads.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AO.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AK through M3AE-AO in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AN held-out behavior check receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json).
5. M3AE-AM held-out behavior check design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md).
6. M3AE-AL architecture-microprobe receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json).
7. M3AE-AK architecture design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md).
8. M3AE-AJ median-baseline diagnostic receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json).
9. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
10. Current approved Detector 0 packet:
    [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
11. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
12. Source register:
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
jq empty docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md
test -s docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one design-only slice:

1. Preserve M3AE-AN as the current held-out failure source of truth.
2. Explain why the M3AE-AK/AL formulation can fit train but fails held-out
   presence and box behavior.
3. Reject threshold tuning, crop-normalization ablation, recognizer training,
   product threshold selection, export, promotion, or readiness claims from the
   current evidence.
4. Define what a future architecture/objective remediation would change. Any
   future trainable action must have explicit train and held-out gates, direct
   M3AE-AJ median-baseline comparison, and no-pretrained/source/Brev
   boundaries.
5. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md)
   with evidence bindings, failure explanation, rejected options, selected or
   stopped remediation path, future gates, boundaries, final-promotion blocker
   separation, and exactly one next action.
6. Update the Mutable Tactical Overlay with the artifact and exactly one next
   action.
7. Write a numbered session log.

## Required Design Content

The design artifact must answer:

- Which M3AE-AN held-out failures are architecture/objective symptoms rather
  than data/schema invalidation?
- Why is threshold selection not an acceptable remediation?
- Which architecture/objective changes are rejected and why?
- If a future `detector0_union_target_architecture_microprobe_v2` is selected,
  what exact gates must it meet before any crop-normalization ablation or
  recognizer work?
- If no bounded no-new-source architecture remediation is justified, why is
  `stop_reduced_claim` the honest next action?
- How are no-pretrained, source, Brev, final-promotion, and product-runtime
  boundaries preserved?

## Next-Action Choices

Choose exactly one next action in the artifact:

- `detector0_union_target_architecture_microprobe_v2`: use only if the design
  defines a bounded future microprobe whose train and held-out gates directly
  address the M3AE-AN failure without new source, pretrained dependencies,
  threshold promotion, or Brev spend.
- `detector0_union_target_data_or_schema_remediation`: use only if the design
  finds concrete packet, split, target, tensor-hash, or schema evidence that
  invalidates the held-out comparison.
- `stop_reduced_claim`: use if no bounded no-new-source architecture
  remediation is justified without human sign/data review, Brev spend, new
  source approval, generated labels, pretrained detectors/landmarks, or a
  weakened product claim.

Do not choose crop-normalization ablation, recognizer training, export, or model
promotion directly from this mission.

## Hard Boundaries

- Do not rerun the M3AE-AL microprobe.
- Do not run Detector 0 training or a generic training-smoke retry.
- Do not load image or tensor payloads.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not run crop-normalization ablation in this slice.
- Do not select or promote a new product threshold.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AO.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid.
4. The architecture remediation design exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md)
   and records M3AE-AN failure evidence, train-fit versus held-out split,
   rejected threshold/product-claim workarounds, rejected and selected
   architecture/objective options, future gates, boundary booleans, and exactly
   one next action.
5. The design proves no microprobe rerun, training run, image/tensor payload
   load, Brev compute, model artifact export, model-card promotion, product
   threshold promotion, or product claim occurred.
6. The Mutable Tactical Overlay links to the design artifact and records exactly
   one next action.
7. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, M3AE-AJ receipt hash, M3AE-AK design hash,
   M3AE-AL microprobe receipt hash, M3AE-AM design artifact path/hash,
   M3AE-AN held-out behavior receipt path/hash, architecture remediation design
   path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
8. No microprobe rerun, Detector 0 training, generic training-smoke retry,
   image/tensor payload load, Brev sync/training/spend, crop-normalization
   ablation, recognizer training, packet mutation, row addition, label
   expansion, controlled clip-heldout evaluation, source approval/import,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, product-runtime code change, threshold promotion,
   pretrained detector/landmark use, generated pseudo-label use, or push
   occurs.

When all eight are true, continue the goal loop according to the artifact's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AO Detector 0 union-target architecture remediation.
Completed:            <design artifact or exact no-spend blocker>.
Evidence:             <artifact path/hash, M3AE-AN failure evidence, rejected workarounds, no-training/Brev boundaries>.
Remaining:            <single next action from the artifact>.
Blockers:             <none, or exact architecture/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
