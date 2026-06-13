# Return-To-Form M3HR Detector0 Overlay Readiness Review No Brev Goal Loop Prompt

Mission 3HR prompt for the Codex executor after M3HQ materialized Detector 0
packet overlays and selected
`continue_m3hr_detector0_overlay_readiness_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 overlay readiness review slice. The goal is to determine whether the
M3HQ overlay artifact is internally complete enough to support a future
packet-expansion, source/hard-negative review, or overlay-gap repair decision.
Keep that readiness classification separate from full scratch-trained Detector
0 training/evaluation, browser promotion, final gates, or claim expansion.

This mission may create one readiness-review artifact, one validation receipt,
and one numbered session log. It must not mutate the M3HQ overlay artifact, the
M3HN packet draft, the existing approved V0 packet, source manifests, source
register, labels, tensors, vocabulary, model cards, runtime code, final gates,
claim surfaces, or side-worktree files. It must not inspect raw learner media,
import media, draw boxes, start or stop Brev, run remote commands,
train/evaluate a recognizer, train Detector 0, export, promote, activate
browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HQ evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json)
   - [`docs/validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json`](../validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json)
   - [`docs/session-logs/699-mission-3hq-detector0-packet-overlay-materialization-no-brev.md`](../session-logs/699-mission-3hq-detector0-packet-overlay-materialization-no-brev.md)
5. M3HP evidence:
   - [`docs/model/return-to-form-detector0-target-policy-review-v1.json`](return-to-form-detector0-target-policy-review-v1.json)
   - [`docs/validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json`](../validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json)
   - [`docs/session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md`](../session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md)
6. M3HO evidence:
   - [`docs/validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json`](../validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json)
   - [`docs/session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md`](../session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md)
7. M3HN packet evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`docs/validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json`](../validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json)
   - [`docs/session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md`](../session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md)
8. M3HM plan and M3HL contract:
   - [`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`](return-to-form-detector0-targeted-annotation-packet-plan-v1.json)
   - [`docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`](return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json)
9. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
10. Existing manifest, annotation, source, and review evidence:
    - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
    - [`data/manifests/return-to-form-tier0/train.json`](../../data/manifests/return-to-form-tier0/train.json)
    - [`data/manifests/return-to-form-tier0/validation.json`](../../data/manifests/return-to-form-tier0/validation.json)
    - [`data/manifests/return-to-form-tier0/test.json`](../../data/manifests/return-to-form-tier0/test.json)
    - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
    - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
11. Existing audits:
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
- M3HQ materialized the current 32 M3HN review-ready rows into an overlay
  artifact with source/license, provenance, no-pretrained, canonical
  coordinate-space, `absence_reason`, and `target_applicability` overlays.
- M3HQ did not make the packet ready for full scratch Detector 0
  training/evaluation, browser promotion, final gates, or claim expansion.
- Current promoted target IDs remain `left_or_first_hand`,
  `right_or_second_hand`, `head_or_face`, and
  `upper_body_or_signing_space`.
- `table_two_hand_union_or_contact_region` remains auxiliary/table-scoped only
  and outside detector-card target IDs.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training overlay-readiness review slice:

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
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-target-policy-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool web/public/model/browser-model-bundle.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/test.json >/dev/null
python3 -m json.tool data/manifests/negative-challenge.json >/dev/null
brev ls --json
git diff --check
```

2. Review the M3HQ overlay artifact without mutating it:

- verify overlay row IDs exactly match the current M3HN review-ready row
  references;
- verify row provenance, source/license decisions, allowed label/annotation
  scope, no-pretrained attestations, coordinate-space canonicalization, target
  applicability, absence reasons, and target counts are present and internally
  consistent;
- verify the overlay preserves promoted target IDs and keeps
  `table_two_hand_union_or_contact_region` auxiliary/table-scoped only;
- verify fail-closed claim surfaces are unchanged;
- classify any gap as either overlay-repair, packet-expansion,
  source/hard-negative review, human approval, or research escalation;
- keep every conclusion separate from full training/evaluation, browser
  promotion, final gates, or claim expansion.

3. Do not mutate the M3HQ overlay, M3HN packet draft, existing V0 packet,
   source manifests, source register, labels, tensors, vocabulary, model cards,
   runtime code, final gates, or side-worktree files. Do not inspect raw learner
   media or import media. Do not create a training manifest unless this prompt
   is later replaced by an approved manifest-readiness prompt.

4. Write the tracked readiness-review artifact:

`docs/model/return-to-form-detector0-overlay-readiness-review-v1.json`

The artifact must include:

- current commit and active prompt;
- source files inspected and changed files;
- M3HQ overlay path/hash and row-reference proof;
- M3HQ receipt path/hash and command/forbidden-action proof;
- M3HP policy path/hash and policy-application proof;
- M3HN packet and V0 packet path/hash references;
- source/provenance/no-pretrained requirement checks;
- target-by-target readiness review, including split counts;
- fail-closed claim-surface proof;
- remaining gaps before packet expansion, source/hard-negative review,
  training/evaluation, browser promotion, final gates, or claim expansion;
- exactly one recommended next action.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hr-detector0-overlay-readiness-review-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- Brev default-off read-only inventory;
- files inspected and changed files;
- overlay artifact path/hash and readiness classification;
- target-by-target overlay checks and gap classification;
- source/provenance/no-pretrained requirements;
- forbidden-action proof;
- claim-surface proof;
- exactly one next action.

6. After writing the artifact and receipt, verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-overlay-readiness-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hr-detector0-overlay-readiness-review-no-brev-v1.json >/dev/null
git diff --check
```

7. Write:

`docs/session-logs/701-mission-3hr-detector0-overlay-readiness-review-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hs_detector0_targeted_annotation_packet_expand_no_brev`
- `continue_m3hs_detector0_source_or_hard_negative_review_no_brev`
- `continue_m3hs_detector0_overlay_gap_repair_no_brev`
- `stop_for_human_detector0_overlay_or_annotation_policy_approval`
- `stop_for_human_detector0_source_or_label_approval`
- `escalate_detector0_overlay_readiness_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, or claim expansion from M3HR. Future compute must be a separate
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
  source-register mutation, packet mutation, overlay mutation, target-schema
  mutation, tensor/materialization mutation, vocabulary mutation, model-card
  mutation, runtime claim-surface mutation, export, ONNX, browser artifact
  promotion, browser recognition activation, final gate weakening, push, amend,
  or no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be counted as offline supervision targets only when rights
  and provenance are recorded.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HR.
2. Required local checks pass, or exact blockers are recorded.
3. M3HQ overlay/receipt/log, M3HP policy, M3HO receipt/log, M3HN packet,
   M3HM plan, M3HL contract, V0 packet, source register, manifests, and current
   Detector 0 claim surfaces are inspected.
4. A tracked readiness-review artifact is written without mutating overlay,
   packet, source/manifest/tensor/model-card/runtime/final-gate surfaces, or
   claim surfaces.
5. The readiness review classifies row-reference, source/provenance,
   no-pretrained, coordinate-space, absence-reason, target-applicability,
   auxiliary-target, and split-count completeness.
6. The review preserves promoted target IDs and keeps the auxiliary table
   target table-scoped only.
7. The receipt keeps overlay readiness separate from readiness for full
   scratch-trained Detector 0 training/evaluation, browser promotion, final
   gates, or claim expansion.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, packet/overlay mutation, tensor work, export, promotion, browser
   activation, or unsupported claim work occurs.
9. A tracked readiness-review artifact, receipt, and numbered session log exist
   and select exactly one next action.
10. The change is committed with a message beginning `mission-3hr:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped readiness-review artifact,
  receipt, and log, and selects one allowed next action.
- NUDGE if it misses a required readiness field, row-reference proof,
  source/provenance/no-pretrained separation, forbidden-action proof,
  changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, source-register mutation, packet/overlay mutation,
  tensor/schema mutation, side-worktree merge, export, promotion, browser
  activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, compute, or
  product claims and no current strategy memo covers the exact local evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
