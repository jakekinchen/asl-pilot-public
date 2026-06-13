# Return-To-Form M3HN Detector0 Targeted Annotation Packet Authoring No Brev Goal Loop Prompt

Mission 3HN prompt for the Codex executor after M3HM wrote the Detector 0
targeted annotation packet plan and selected
`continue_m3hn_detector0_targeted_annotation_packet_authoring_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 targeted annotation packet authoring slice. The goal is to
materialize the M3HM plan into a reviewable tracked packet draft from existing
tracked evidence: existing reviewed Detector 0 rows, tracked source/manifest
metadata, split accounting, target coverage, negative/challenge row candidates,
and explicit review blockers.

This mission may create a new packet draft and receipt. It must not mutate the
existing approved packet, source manifests, source register, labels, tensors,
model cards, runtime code, final gates, or claim surfaces. It must not inspect
raw learner media, import media, draw unreviewed boxes from raw video, start or
stop Brev, run remote commands, train/evaluate a recognizer, train Detector 0,
export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HM evidence:
   - [`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`](return-to-form-detector0-targeted-annotation-packet-plan-v1.json)
   - [`docs/validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json`](../validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json)
   - [`docs/session-logs/691-mission-3hm-detector0-targeted-annotation-packet-plan-no-brev.md`](../session-logs/691-mission-3hm-detector0-targeted-annotation-packet-plan-no-brev.md)
5. M3HL contract:
   - [`docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`](return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json)
   - [`docs/validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json`](../validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json)
6. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
7. Existing manifest, annotation, source, and review evidence:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/manifests/return-to-form-tier0/train.json`](../../data/manifests/return-to-form-tier0/train.json)
   - [`data/manifests/return-to-form-tier0/validation.json`](../../data/manifests/return-to-form-tier0/validation.json)
   - [`data/manifests/return-to-form-tier0/test.json`](../../data/manifests/return-to-form-tier0/test.json)
   - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md)
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
- The existing approved Detector 0 packet has 32 sparse reviewed frame rows.
  It is useful seed evidence, not a full training/evaluation packet.
- `right_or_second_hand` and
  `table_two_hand_union_or_contact_region` support remains table-positive only.
- Negative-challenge evidence is validation/test reject evidence unless a later
  source-rights receipt explicitly approves training use.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training packet-authoring slice:

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
python3 -m json.tool docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/test.json >/dev/null
python3 -m json.tool data/manifests/negative-challenge.json >/dev/null
brev ls --json
git diff --check
```

2. Write one tracked packet draft:

`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`

The packet draft must:

- preserve the existing approved packet file unchanged;
- carry forward existing reviewed rows only with exact provenance and source
  fields, either by reference or by exact copied row payload;
- separate review-ready rows, candidate rows, blocked rows, and not-training-
  ready rows;
- include target-by-target split counts for `left_or_first_hand`,
  `right_or_second_hand`, `head_or_face`, and `upper_body_or_signing_space`;
- keep `table_two_hand_union_or_contact_region` auxiliary/table-scoped only;
- include planned or candidate validation/test reject rows from
  `negative-challenge.json` only as validation/test candidates unless source
  rights explicitly approve training use;
- record required per-row provenance and no-pretrained attestations from the
  M3HM plan;
- record explicit source, annotation, target-policy, and human-review blockers
  instead of silently assuming missing approval;
- mark the packet as not ready for Detector 0 training/evaluation unless every
  M3HM/M3HL readiness prerequisite is actually satisfied.

3. Preserve the current Detector 0 target schema. If the target schema should
   change, record that as a blocker and select an allowed ESCALATE or
   human-review next action instead of changing it inside M3HN.

4. Do not mutate source manifests, the existing approved annotation packet,
   source registers, labels, tensors, vocabulary, model cards, runtime code,
   final gates, or side-worktree files. Do not inspect raw learner media or
   import media. A new packet draft, validation receipt, and numbered session
   log are allowed.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- Brev default-off read-only inventory;
- files inspected and changed files;
- packet draft path and hash;
- M3HM plan-to-packet mapping;
- existing approved-row carry-forward policy;
- target-by-target split counts and gaps;
- negative/challenge candidate policy and source-rights limits;
- source/provenance/no-pretrained requirements;
- unresolved human-review or ESCALATE decisions;
- forbidden-action proof;
- claim-surface proof;
- exactly one next action.

6. Write:

`docs/session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ho_detector0_annotation_packet_review_no_brev`
- `continue_m3ho_detector0_targeted_annotation_packet_expand_no_brev`
- `continue_m3ho_detector0_source_or_label_review_no_brev`
- `continue_m3ho_detector0_bounded_brev_training_receipt_no_training`
- `stop_for_human_detector0_annotation_or_schema_approval`
- `stop_for_human_detector0_source_or_label_approval`
- `escalate_detector0_packet_authoring_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, or claim expansion from M3HN. Future compute must be a separate
receipt-backed route and must have explicit human approval before any Brev
lifecycle or remote command runs.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running. If it reports a running worker, record that as a cost-control
  blocker for observer handling; do not run Brev lifecycle or remote commands
  from this executor slice.
- No recognizer training/evaluation, Detector 0 training, evaluator rerun,
  threshold tuning, source/media import, raw learner media inspection,
  source-register mutation, existing-packet mutation, target-schema mutation,
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

1. `GOAL.md` points at this prompt and names Mission 3HN.
2. Required local checks pass, or exact blockers are recorded.
3. M3HM plan/receipt/log and current Detector 0 claim surfaces are inspected.
4. A tracked Detector 0 targeted annotation packet draft is written without
   mutating the existing approved packet or source/manifest/tensor/model-card/
   runtime/final-gate surfaces.
5. The packet separates review-ready rows, candidate rows, blocked rows, and
   readiness for a real scratch-trained Detector 0 training/evaluation route.
6. The packet records target-by-target split counts, provenance, source-rights,
   no-pretrained, fail-closed, and negative/challenge row policies.
7. Any source, annotation, target-schema, or human-review uncertainty is
   recorded as a blocker or future next action rather than silently assumed.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, source-register mutation, existing-packet mutation, tensor work,
   export, promotion, browser activation, or unsupported claim work occurs.
9. A tracked receipt and numbered session log exist and select exactly one next
   action.
10. The change is committed with a message beginning `mission-3hn:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped packet draft receipt/log, and
  selects one allowed next action.
- NUDGE if it misses M3HM plan mapping, provenance carry-forward, target split
  counts, source/provenance separation, negative/challenge source limits,
  forbidden-action proof, changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, source-register mutation, existing-packet mutation,
  tensor/schema mutation, side-worktree merge, export, promotion, browser
  activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, or compute and
  no current strategy memo covers the exact Detector 0 packet evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
