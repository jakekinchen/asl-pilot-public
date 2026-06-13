# Return-To-Form Tier 0 Detector 0 Union-Target Architecture Reformulation Design Prompt

Mission 3AE-AK prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write one **local, no-spend, design-only** architecture reformulation for the
`table_two_hand_union_or_contact_region` Detector 0 target.

M3AE-AJ proved that a no-training train-derived median constant box beats the
current trainable M3AE-AG and M3AE-AI smokes on train, validation, and test
box MAE. The next step is not another generic training-smoke retry. The next
step is a design artifact that selects a trainable formulation with a concrete
path to beat the M3AE-AJ median-box bar on train before any crop-normalization
ablation or recognizer work.

This is a design slice only. Do not train, run a training smoke, export a model,
promote a model card, run crop-normalization ablation, or claim product
readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AK.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AK in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AJ median-baseline diagnostic receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json).
5. M3AE-AJ session log:
   [`docs/session-logs/250-return-to-form-tier0-detector0-union-target-median-baseline-diagnostic.md`](../session-logs/250-return-to-form-tier0-detector0-union-target-median-baseline-diagnostic.md).
6. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
7. M3AE-AI smoke-continue receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json).
8. M3AE-AH remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json).
9. M3AE-AG smoke receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json).
10. Current approved Detector 0 packet:
    [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
11. M3AE-AF margin packet mutation receipt, M3AE-AE schema revision, M3AE-AD
    remediation receipt, M3AE-AC packet mutation receipt, and M3AE-AB schema.
12. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
13. Source register:
    [`docs/model/dataset-source-register.json`](dataset-source-register.json).
14. Observer localization memo:
    [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md).

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json \
  docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
test -s artifacts/research/observer-201-localization-strategy-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one design-only slice:

1. Preserve M3AE-AJ and observer-249 as the current failure evidence.
2. Compare plausible trainable formulations against the M3AE-AJ bar, including
   why the M3AE-AG/AJ MLP-over-downsampled-full-frame formulation is rejected.
3. Select one trainable formulation for a future microprobe. The design should
   specify input representation, target encoding, output constraints, loss
   terms, initialization, batch/epoch bounds, success threshold, and stop rule.
4. Require the future training-style slice to beat the train-derived median
   constant-box MAE on train before any crop-normalization ablation or
   recognizer training.
5. Keep the design no-pretrained and no-new-source. Do not recommend MediaPipe,
   OpenPose, YOLO, pretrained landmarks, pretrained detector outputs, pretrained
   backbones, generated pseudo-labels, source expansion, or Brev spend.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md)
   with design constraints, rejected options, selected formulation, future
   command sketch, exact success/failure gates, no-training/no-pretrained/source
   boundaries, Brev no-spend boundary, final-promotion blocker separation, and
   exactly one next action.
7. Update the Mutable Tactical Overlay with the design artifact and exactly one
   next action.
8. Write a numbered session log.

If the design cannot identify a bounded no-new-source trainable formulation
that could reasonably beat the median-box bar on train, choose
`stop_reduced_claim`.

## Next-Action Choices

Choose exactly one next action in the design artifact:

- `detector0_union_target_architecture_microprobe`: use when the design selects
  one bounded local no-spend trainable formulation and defines an explicit
  train-set median-baseline-beating gate for a future microprobe.
- `detector0_union_target_data_or_schema_remediation`: use when the design
  finds a concrete packet, split, target, tensor, or schema problem that
  invalidates the architecture comparison.
- `stop_reduced_claim`: use when no bounded no-new-source trainable Detector 0
  path is justified without human sign/data review, Brev spend, new source
  approval, or a changed product claim.

Do not run the selected microprobe in this mission.

## Hard Boundaries

- Do not run Detector 0 training or a training-smoke retry.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AK.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The architecture-reformulation design exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md)
   and records design constraints, rejected formulations, selected trainable
   formulation, future command sketch, target encoding/loss/initialization
   details, exact success and stop gates, no-training/no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
6. The design proves no training run, gradient update, model artifact export,
   or model-card promotion occurred.
7. The Mutable Tactical Overlay links to the design artifact and records exactly
   one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, M3AE-AJ receipt hash, Brev worker status,
   manual stop command `brev stop asl-pilot-rawframe-001`, Brev no-spend
   boundary, and the next action.
9. No Detector 0 training, training-smoke retry, Brev sync/training/spend,
   crop-normalization ablation, recognizer training, packet mutation, row
   addition, label expansion, controlled clip-heldout evaluation, source
   approval/import, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, product-runtime code change, pretrained
   detector/landmark use, generated pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the
architecture-reformulation design artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AK Detector 0 union-target architecture reformulation design.
Completed:            <architecture design artifact or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, selected formulation, median-baseline gate, no-training status>.
Remaining:            <single next action from the design artifact>.
Blockers:             <none, or exact design/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
