# Return-To-Form M3HL Detector0 Manifest Or Label Contract Repair No Brev Goal Loop Prompt

Mission 3HL prompt for the Codex executor after M3HK proved that the current
tracked Detector 0 data and labels are not complete enough for a full
scratch-trained Detector 0 training/evaluation route and selected
`continue_m3hl_detector0_manifest_or_label_contract_repair_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute Detector 0
manifest or label contract repair. The goal is to convert the M3HK audit gaps
into a reviewable tracked contract for the next Detector 0 data/label slice:
required manifest rows, target coverage, provenance, split separation,
hard-negative/no-hand coverage, temporal coverage, IoU evaluation rows, false
no-hand accounting, and browser-latency prerequisites.

This mission is a contract/receipt slice, not a data mutation, training,
source-import, side-worktree merge, or compute slice. It must not start or stop
Brev, run remote commands, train or evaluate a recognizer, train Detector 0,
import sources, inspect raw learner media, mutate labels/manifests/tensors,
export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HK evidence:
   - [`docs/validation/return-to-form-m3hk-detector0-training-data-manifest-or-label-audit-no-brev-v1.json`](../validation/return-to-form-m3hk-detector0-training-data-manifest-or-label-audit-no-brev-v1.json)
   - [`docs/session-logs/688-mission-3hk-detector0-training-data-manifest-or-label-audit-no-brev.md`](../session-logs/688-mission-3hk-detector0-training-data-manifest-or-label-audit-no-brev.md)
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
7. Existing Detector 0 target/schema evolution receipts:
   - [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json)
8. Existing audits:
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
- M3HK found the Tier 0 clip manifests have 345 PopSign clips across five
  labels, but the approved Detector 0 annotation packet has only 32 sparse
  frame rows.
- `right_or_second_hand` and
  `table_two_hand_union_or_contact_region` support is table-only.
- No complete Detector 0 training/evaluation manifest binds target rows to
  hard-negative/no-hand/empty/low-light rows, temporal rows, IoU `0.30`/`0.50`
  evaluation rows, false no-hand accounting, or browser latency prerequisites.
- Current strict-gate evidence is diagnostic only and fails intended Detector 0
  recall and coverage gates: validation-frame recall `0.0575` at the 5 percent
  FPR threshold, precision `0.22549`, F1 `0.0916`, and learned right-hand crop
  usage around `6.07%`.

## Required Slice

Complete one local/no-remote/no-Brev/no-training contract repair slice:

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
python3 -m json.tool docs/validation/return-to-form-m3hk-detector0-training-data-manifest-or-label-audit-no-brev-v1.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/test.json >/dev/null
brev ls --json
git diff --check
```

2. Repair the contract, not the data. The new or updated tracked contract must
   make these distinctions explicit:

   - current candidate rows versus full training/evaluation readiness;
   - required target IDs from the current Detector 0 card:
     `left_or_first_hand`, `right_or_second_hand`, `head_or_face`, and
     `upper_body_or_signing_space`;
   - optional or auxiliary targets, including
     `table_two_hand_union_or_contact_region`, and why they are not a
     substitute for full Detector 0 readiness;
   - required train/validation/test split accounting and source/signer/clip
     separation fields;
   - required provenance fields for human-authored or explicitly
     source-approved offline supervision labels;
   - hard-negative, no-hand, empty-camera, low-light, temporal sequence, IoU
     `0.30`/`0.50`, false no-hand, false trigger, and browser-latency metric
     prerequisites;
   - source-rights checks that prevent raw-video-only approvals from being
     silently treated as label/landmark/box approvals;
   - no-pretrained and fail-closed claim-surface requirements.

3. The repair must preserve the current target schema. If the evidence shows
   the target schema itself should change, record that as a blocker and select
   an allowed ESCALATE or human-review next action instead of changing the
   schema inside M3HL.

4. Do not mutate manifests, annotation packets, source registers, labels,
   tensors, vocabulary, model cards, runtime code, final gates, or side
   worktree files. Do not port side-worktree files. A docs/model contract file,
   validation receipt, and numbered session log are allowed.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- Brev default-off read-only inventory;
- files inspected and changed files;
- the contract file path and hash;
- M3HK gap-to-contract mapping;
- target-by-target readiness requirements;
- metric-prerequisite requirements;
- source/provenance/no-pretrained requirements;
- side-worktree non-porting proof;
- forbidden-action proof;
- claim-surface proof;
- exactly one next action.

6. Write:

`docs/session-logs/690-mission-3hl-detector0-manifest-or-label-contract-repair-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hm_detector0_source_or_label_review_packet_no_brev`
- `continue_m3hm_detector0_targeted_annotation_packet_plan_no_brev`
- `continue_m3hm_detector0_sideworktree_contract_integration_no_brev`
- `continue_m3hm_detector0_bounded_brev_training_receipt_no_training`
- `stop_for_human_detector0_source_or_label_approval`
- `stop_for_human_detector0_contract_or_schema_approval`
- `escalate_detector0_manifest_contract_strategy_with_local_evidence`

Do not select a direct training, Brev lifecycle, export, promotion, browser
activation, or claim-expansion action from M3HL. Future compute must be a
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

1. `GOAL.md` points at this prompt and names Mission 3HL.
2. Required local checks pass, or exact blockers are recorded.
3. M3HK receipt/log and current Detector 0 claim surfaces are inspected.
4. A tracked Detector 0 manifest/label training-evaluation contract is written
   or updated without mutating data.
5. The contract separates candidate-row existence from readiness for a real
   scratch-trained Detector 0 training/evaluation route.
6. The contract records target-by-target requirements and metric prerequisites.
7. Source/provenance, no-pretrained, fail-closed, and raw-video-only approval
   boundaries are explicit.
8. Brev remains default-off and no lifecycle, remote, training, source,
   manifest/label/tensor, export, promotion, browser activation, or unsupported
   claim work occurs.
9. A tracked receipt and numbered session log exist and select exactly one next
   action.
10. The change is committed with a message beginning `mission-3hl:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped contract receipt/log, and
  selects one allowed next action.
- NUDGE if it misses M3HK gap mapping, target coverage requirements, source or
  provenance separation, metric prerequisites, forbidden-action proof, changed
  file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, manifest/annotation/tensor/schema mutation, side-worktree
  merge, export, promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, or compute and
  no current strategy memo covers the exact Detector 0 data evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
