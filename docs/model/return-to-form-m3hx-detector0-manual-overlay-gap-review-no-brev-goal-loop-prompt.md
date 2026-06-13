# Return-To-Form M3HX Detector0 Manual Overlay Gap Review No Brev Goal Loop Prompt

Mission 3HX prompt for the Codex executor after M3HW preserved the single
manual-overlay gap blocker and selected
`continue_m3hx_detector0_manual_overlay_gap_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 manual overlay gap-review slice. The goal is to review the M3HW
gap-repair artifact, receipt, and session log against the current M3HV/M3HU/
M3HT/M3HS/M3HQ/M3HN/V0/source/claim evidence, decide whether the preserved
`insufficient_visual_evidence` blocker is reviewer-grade and internally
consistent, and choose the next bounded Detector 0 data/readiness action.

This mission may create one review artifact, one validation receipt, and one
numbered session log. It must not mutate the M3HW gap-repair artifact, M3HV
manual overlay packet, M3HT contract, M3HS expansion artifact, M3HQ overlay,
M3HN packet draft, approved V0 packet, source manifests, source register,
tensors, vocabulary, model cards, runtime code, final gates, claim surfaces, or
side-worktree files. It must not implement annotation tooling in this slice; if
annotation tooling is the next useful move, route to an executor-owned M3HY
implementation prompt with exact scope and validation.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HW gap-repair evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json)
   - [`docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json`](../validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json)
   - [`docs/session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md`](../session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md)
5. M3HV manual overlay evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json)
   - [`docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json`](../validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json)
   - [`docs/session-logs/708-mission-3hv-detector0-manual-contact-sheet-overlay-packet-no-brev.md`](../session-logs/708-mission-3hv-detector0-manual-contact-sheet-overlay-packet-no-brev.md)
6. Fixed-baseline gate evidence:
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json)
   - [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json)
7. Packet/overlay/source evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
8. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

Treat these facts as current unless live tracked evidence proves otherwise:

- Detector 0 is not trained, accurate, or spec-fit today.
- M3HV added 17 new manual hand-box rows from the 18 source-bound table
  temporal-neighbor candidates.
- M3HW preserved the remaining row,
  `det0-exp1-validation-table-000376-f004`, as explicit
  `insufficient_visual_evidence` because frame 4 did not show reliably
  separable left/right hand targets.
- The fixed-baseline beat-it gate is still current: any learned hand detector
  must beat held-out fixed baselines left `0.4073` and right `0.6476` before
  improvement, export, promotion, activation, or claim language.
- Learn `left_or_first_hand` and `right_or_second_hand`; keep `head_or_face`
  and `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only.
- Brev is default-off for this mission. Read-only `brev ls --json` is allowed
  only to prove no unexpected paid work is running.

## Required Slice

Complete one local/no-remote/no-Brev/no-training review:

1. Verify live state and required checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_manifest_contract.mjs
node scripts/audit_detector0_strict_gate_crop_contract.mjs --json
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool web/public/model/browser-model-bundle.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Review M3HW:

- confirm the artifact references the correct active prompt, commit, row id,
  source record, tensor hash, contact-sheet/tensor/V0/temporal-neighbor
  evidence, target-by-target disposition, source-rights proof, no-pretrained
  attestation, and fail-closed claim-surface proof;
- confirm preserving `insufficient_visual_evidence` is justified by retained
  evidence, not by lack of effort;
- confirm it did not copy frame-5/frame-6 boxes backward into frame 4;
- confirm it added no training/evaluation/promotion/claim meaning;
- classify whether the 17 M3HV manual hand-box rows plus the one explicit
  blocker are ready for a consolidation/worklist/tooling slice, or whether a
  source/hard-negative/rights blocker should come first.

3. Write:

`docs/model/return-to-form-detector0-manual-overlay-gap-review-v1.json`

The review artifact must include the M3HW evidence verdict, any residual gaps,
the current count of newly authored manual hand rows, the preserved blocker
classification, fixed-baseline gate continuity, source/provenance/no-pretrained
proof, claim-surface proof, readiness classification, and exactly one next
action.

4. Write:

`docs/validation/return-to-form-m3hx-detector0-manual-overlay-gap-review-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected/changed, review artifact hash, M3HW verdict,
forbidden-action proof, and exactly one next action.

5. Write:

`docs/session-logs/712-mission-3hx-detector0-manual-overlay-gap-review-no-brev.md`

6. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-manual-overlay-gap-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hx-detector0-manual-overlay-gap-review-no-brev-v1.json >/dev/null
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3hy_detector0_annotation_workbench_no_brev`
- `continue_m3hy_detector0_manual_overlay_packet_consolidation_no_brev`
- `continue_m3hy_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_manual_overlay_strategy_with_local_evidence`

Prefer `continue_m3hy_detector0_annotation_workbench_no_brev` when the M3HW
blocker is reviewer-grade and the highest-leverage next action is to let an
executor build a small local annotation-prep/export tool from already-approved
tracked tensors. Do not implement that tool in M3HX.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No annotation tool implementation in this review slice.
- No recognizer training/evaluation, Detector 0 training, evaluator rerun,
  source/media import, raw learner media inspection, source-register mutation,
  packet/overlay/base-artifact mutation, tensor mutation, vocabulary mutation,
  model-card or claim-surface mutation, final-gate change, export, ONNX,
  browser artifact promotion, browser recognition activation, push, amend, or
  no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HX.
2. Required local checks pass, or exact blockers are recorded.
3. M3HW gap-repair evidence is reviewed against M3HV/M3HU/M3HT/M3HS/M3HQ/M3HN/
   V0/source/claim evidence.
4. A tracked review artifact and receipt classify the preserved blocker and
   keep the slice separate from training/evaluation, browser promotion, final
   gates, or claim expansion.
5. Brev remains default-off and no lifecycle, remote, training, source/media
   import, base-artifact mutation, tensor work, export, promotion, browser
   activation, or unsupported claim work occurs.
6. Exactly one next action is selected.
7. The change is committed with a message beginning `mission-3hx:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  writes the review artifact, receipt, and log, and selects one allowed next
  action.
- NUDGE if it misses the M3HW verdict, source/provenance/no-pretrained proof,
  fixed-baseline gate continuity, forbidden-action proof, or exactly one next
  action.
- REDIRECT if it implements annotation tooling inside M3HX, mutates base
  artifacts, starts Brev/remote/training, or expands claims.
- ESCALATE if repeated label/data/tooling slices cannot produce a concrete path
  to materially more trusted hand-box supervision.
