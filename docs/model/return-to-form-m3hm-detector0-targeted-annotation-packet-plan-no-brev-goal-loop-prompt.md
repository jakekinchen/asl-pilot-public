# Return-To-Form M3HM Detector0 Targeted Annotation Packet Plan No Brev Goal Loop Prompt

Mission 3HM prompt for the Codex executor after M3HL repaired the Detector 0
manifest/label training-evaluation contract and selected
`continue_m3hm_detector0_targeted_annotation_packet_plan_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 targeted annotation packet plan. The goal is to turn the M3HL
contract into a reviewable plan for the next annotation packet slice: which
target IDs, splits, row types, provenance fields, metric prerequisites, and
source-rights checks a future packet must satisfy before any Detector 0
training/evaluation route can be considered.

This mission is a planning/receipt slice, not an annotation, data mutation,
source import, training, side-worktree merge, or compute slice. It must not
start or stop Brev, run remote commands, inspect raw learner media, import
media, mutate manifests/annotations/labels/tensors/model cards/runtime/final
gates, export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HL evidence:
   - [`docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`](return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json)
   - [`docs/validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json`](../validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json)
   - [`docs/session-logs/690-mission-3hl-detector0-manifest-or-label-contract-repair-no-brev.md`](../session-logs/690-mission-3hl-detector0-manifest-or-label-contract-repair-no-brev.md)
5. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
6. Existing manifest, annotation, source, and target evidence:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/manifests/return-to-form-tier0/train.json`](../../data/manifests/return-to-form-tier0/train.json)
   - [`data/manifests/return-to-form-tier0/validation.json`](../../data/manifests/return-to-form-tier0/validation.json)
   - [`data/manifests/return-to-form-tier0/test.json`](../../data/manifests/return-to-form-tier0/test.json)
   - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md)
7. Existing audits:
   - [`scripts/audit_source_register.mjs`](../../scripts/audit_source_register.mjs)
   - [`scripts/audit_no_pretrained_deps.mjs`](../../scripts/audit_no_pretrained_deps.mjs)
   - [`scripts/audit_no_pretrained_artifact_json.mjs`](../../scripts/audit_no_pretrained_artifact_json.mjs)
   - [`scripts/audit_detector0_manifest_contract.mjs`](../../scripts/audit_detector0_manifest_contract.mjs)
   - [`scripts/audit_detector0_strict_gate_crop_contract.mjs`](../../scripts/audit_detector0_strict_gate_crop_contract.mjs)

## Current Detector 0 State

Treat these facts as current unless live tracked evidence proves otherwise:

- Detector 0 is not trained, accurate, or spec-fit today.
- `web/public/model/detector0-card.json` remains `status: "not_trained"`,
  `promotion_state: "research_only"`, with `browser_artifact: null`.
- M3HL created
  `docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`
  and recorded that current data are not ready for full scratch-trained
  Detector 0 training/evaluation or browser promotion.
- The current packet has only 32 sparse frame rows; `right_or_second_hand` and
  `table_two_hand_union_or_contact_region` support is table-only.
- Hard-negative, no-hand, empty-camera, low-light, temporal, IoU `0.30`/`0.50`,
  false no-hand, false trigger, and browser-latency prerequisites are still
  missing for a real Detector 0 training/evaluation route.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training annotation-packet planning
slice:

1. Verify live state and baseline checks:

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
python3 -m json.tool docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/test.json >/dev/null
python3 -m json.tool data/manifests/negative-challenge.json >/dev/null
brev ls --json
git diff --check
```

2. Write a tracked targeted annotation packet plan:

`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`

The plan must map the M3HL contract into future packet requirements without
mutating the packet. Include:

- current candidate rows versus full packet readiness;
- target-by-target planned coverage for `left_or_first_hand`,
  `right_or_second_hand`, `head_or_face`, and `upper_body_or_signing_space`;
- treatment of `table_two_hand_union_or_contact_region` as auxiliary/table
  scoped only;
- planned row types by train/validation/test split, including positive target
  rows, explicit absent/not-applicable rows, hard-negative/no-hand rows,
  empty-camera, low-light, off-center, non-target signing, temporal sequence,
  and held-out IoU rows;
- minimum provenance fields for each future row, including source, signer,
  clip, frame or sequence, annotation source, annotator/reviewer, source-rights
  decision, and no-pretrained attestation;
- source-rights checks that keep raw-video-only approvals separate from
  landmark/box/region/derived-label approvals;
- review steps for human-authored or explicitly source-approved offline labels;
- exact unresolved decisions that require a later human review or ESCALATE
  rather than being assumed inside this plan.

3. Preserve the current Detector 0 target schema. If the target schema should
   change, record that as a blocker and select an allowed ESCALATE or
   human-review next action instead of changing it inside M3HM.

4. Do not mutate manifests, annotation packets, source registers, labels,
   tensors, vocabulary, model cards, runtime code, final gates, claim surfaces,
   or side-worktree files. Do not inspect raw learner media or import media.
   A docs/model plan file, validation receipt, and numbered session log are
   allowed.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- Brev default-off read-only inventory;
- files inspected and changed files;
- annotation packet plan path and hash;
- M3HL contract-to-plan mapping;
- target-by-target planned coverage and gaps;
- metric-prerequisite planned coverage and gaps;
- source/provenance/no-pretrained requirements;
- forbidden-action proof;
- claim-surface proof;
- exactly one next action.

6. Write:

`docs/session-logs/691-mission-3hm-detector0-targeted-annotation-packet-plan-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hn_detector0_targeted_annotation_packet_authoring_no_brev`
- `continue_m3hn_detector0_source_or_label_review_packet_no_brev`
- `continue_m3hn_detector0_sideworktree_contract_integration_no_brev`
- `continue_m3hn_detector0_bounded_brev_training_receipt_no_training`
- `stop_for_human_detector0_annotation_or_schema_approval`
- `stop_for_human_detector0_source_or_label_approval`
- `escalate_detector0_annotation_packet_strategy_with_local_evidence`

Do not select a direct training, Brev lifecycle, export, promotion, browser
activation, or claim-expansion action from M3HM. Future compute must be a
separate receipt-backed route and must have explicit human approval before any
Brev lifecycle or remote command runs.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running. If it reports a running worker, record that as a cost-control
  blocker for observer handling; do not run Brev lifecycle or remote commands
  from this executor slice.
- No recognizer training/evaluation, Detector 0 training, evaluator rerun,
  threshold tuning, source/media import, raw learner media inspection,
  manifest mutation, annotation mutation, target-schema mutation,
  tensor/materialization mutation, vocabulary mutation, model-card mutation,
  runtime claim-surface mutation, export, ONNX, browser artifact promotion,
  browser recognition activation, final gate weakening, push, amend, or
  no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be counted as offline supervision targets only when rights
  and provenance are recorded.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HM.
2. Required local checks pass, or exact blockers are recorded.
3. The M3HL contract/receipt/log and current Detector 0 claim surfaces are
   inspected.
4. A tracked Detector 0 targeted annotation packet plan is written without
   mutating data, labels, manifests, source registers, tensors, model cards,
   runtime code, final gates, side-worktree files, or claim surfaces.
5. The plan separates current candidate rows from readiness for a real
   scratch-trained Detector 0 training/evaluation packet.
6. The plan records target-by-target, split, metric, provenance, source-rights,
   no-pretrained, and fail-closed requirements.
7. Any source, annotation, target-schema, or human-review uncertainty is
   recorded as a blocker or future next action rather than silently assumed.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, manifest/label/tensor, export, promotion, browser activation, or
   unsupported claim work occurs.
9. A tracked receipt and numbered session log exist and select exactly one
   next action.
10. The change is committed with a message beginning `mission-3hm:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped plan receipt/log, and selects
  one allowed next action.
- NUDGE if it misses M3HL contract mapping, target coverage requirements,
  split/metric planning, source/provenance separation, forbidden-action proof,
  changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, manifest/annotation/tensor/schema mutation,
  side-worktree merge, export, promotion, browser activation, or claim
  expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, or compute and
  no current strategy memo covers the exact Detector 0 data evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
