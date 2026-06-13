# Return-To-Form M3HP Detector0 Target Policy Review No Brev Goal Loop Prompt

Mission 3HP prompt for the Codex executor after M3HO reviewed the Detector 0
targeted annotation packet and selected
`continue_m3hp_detector0_target_policy_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 target-policy review slice. The goal is to resolve, or explicitly
classify as approval-gated, the target-policy questions that block safe
per-row overlay materialization and later packet expansion:

- `right_or_second_hand` absent versus not-applicable-by-label semantics;
- `upper_body_or_signing_space` upper-body versus signing-space semantics;
- `table_two_hand_union_or_contact_region` auxiliary/table-scoped usage;
- coordinate-space and target-applicability policy needed before per-row
  overlays are materialized.

This mission may create a target-policy artifact, a new validation receipt, and
a numbered session log. It must not mutate the M3HN packet draft, the existing
approved V0 packet, source manifests, source register, labels, tensors, model
cards, runtime code, final gates, claim surfaces, or side-worktree files. It
must not inspect raw learner media, import media, draw boxes, start or stop
Brev, run remote commands, train/evaluate a recognizer, train Detector 0,
export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HO evidence:
   - [`docs/validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json`](../validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json)
   - [`docs/session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md`](../session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md)
5. M3HN evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`docs/validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json`](../validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json)
   - [`docs/session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md`](../session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md)
6. M3HM plan evidence:
   - [`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`](return-to-form-detector0-targeted-annotation-packet-plan-v1.json)
   - [`docs/validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json`](../validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json)
7. M3HL contract:
   - [`docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`](return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json)
8. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
9. Existing manifest, annotation, source, and review evidence:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/manifests/return-to-form-tier0/train.json`](../../data/manifests/return-to-form-tier0/train.json)
   - [`data/manifests/return-to-form-tier0/validation.json`](../../data/manifests/return-to-form-tier0/validation.json)
   - [`data/manifests/return-to-form-tier0/test.json`](../../data/manifests/return-to-form-tier0/test.json)
   - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md)
10. Existing audits:
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
- M3HO found the M3HN packet internally reviewable, but not ready for full
  scratch Detector 0 training/evaluation, browser promotion, final gates, or
  claim expansion.
- The current promoted target IDs remain `left_or_first_hand`,
  `right_or_second_hand`, `head_or_face`, and
  `upper_body_or_signing_space`.
- `table_two_hand_union_or_contact_region` remains auxiliary/table-scoped only
  and outside promoted detector-card target IDs.
- Negative-challenge evidence is validation/test reject evidence unless a later
  source-rights receipt explicitly approves training use.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training target-policy review slice:

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
python3 -m json.tool docs/validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool web/public/model/browser-model-bundle.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/test.json >/dev/null
python3 -m json.tool data/manifests/negative-challenge.json >/dev/null
brev ls --json
git diff --check
```

2. Review the M3HO target-policy blockers without mutating packet or schema
   files:

- decide whether each current `right_or_second_hand` absence class should be
  treated as `true_absent`, `not_applicable_by_label`, or `needs_human_review`
  before any per-row overlay materialization;
- define the minimum policy fields needed to carry that decision per row
  without changing promoted target IDs;
- decide whether `upper_body_or_signing_space` should remain a single coarse
  target for this packet, be constrained to an explicit definition, or require
  human/schema approval before broad authoring expansion;
- keep `table_two_hand_union_or_contact_region` auxiliary/table-scoped only and
  decide whether it can be materialized as diagnostic overlay metadata without
  substituting for promoted hand targets;
- reconcile the coordinate-space alias
  `normalized_full_frame_top_left_xyxy` versus
  `normalized_full_frame_xyxy_top_left_origin` as an equivalence policy or
  record an approval-gated blocker;
- keep target-policy review separate from source-rights approval, row
  annotation expansion, training/evaluation readiness, and browser promotion.

3. Preserve the current Detector 0 target schema. If the target schema should
   change, record that as a blocker and select an allowed ESCALATE or human
   approval next action instead of changing it inside M3HP.

4. Do not mutate source manifests, the M3HN packet draft, the existing approved
   annotation packet, source registers, labels, tensors, vocabulary, model
   cards, runtime code, final gates, or side-worktree files. Do not inspect raw
   learner media or import media. A new target-policy artifact, validation
   receipt, and numbered session log are allowed.

5. Write the tracked policy artifact:

`docs/model/return-to-form-detector0-target-policy-review-v1.json`

The artifact must include:

- current commit and active prompt;
- source files inspected and changed files;
- preserved promoted target IDs;
- right/second-hand absence semantics policy;
- upper-body/signing-space semantics policy;
- auxiliary table union/contact target policy;
- coordinate-space and target-applicability policy;
- source/provenance/no-pretrained boundaries;
- whether any decision needs human approval or research escalation before
  overlay materialization or packet expansion;
- exactly one recommended next action.

6. Write the tracked receipt:

`docs/validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- Brev default-off read-only inventory;
- files inspected and changed files;
- M3HO receipt path/hash and reviewed blockers;
- target policy artifact path/hash;
- target-by-target policy decisions;
- human-approval or ESCALATE blockers;
- source/provenance/no-pretrained requirements;
- forbidden-action proof;
- claim-surface proof;
- exactly one next action.

7. Write:

`docs/session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hq_detector0_packet_overlay_materialization_no_brev`
- `continue_m3hq_detector0_targeted_annotation_packet_expand_no_brev`
- `continue_m3hq_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_target_schema_or_annotation_policy_approval`
- `stop_for_human_detector0_source_or_label_approval`
- `escalate_detector0_target_policy_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, or claim expansion from M3HP. Future compute must be a separate
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
  source-register mutation, packet mutation, target-schema mutation,
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

1. `GOAL.md` points at this prompt and names Mission 3HP.
2. Required local checks pass, or exact blockers are recorded.
3. M3HO receipt/log, M3HN packet/receipt/log, M3HM plan, M3HL contract, and
   current Detector 0 claim surfaces are inspected.
4. A tracked target-policy artifact is written without mutating packet, source,
   manifest, tensor, model-card, runtime, final-gate, or claim surfaces.
5. The artifact and receipt classify `right_or_second_hand`,
   `upper_body_or_signing_space`, `table_two_hand_union_or_contact_region`,
   coordinate-space, `absence_reason`, and `target_applicability` policies.
6. Human-review or ESCALATE blockers are explicit if a policy decision would
   change target schema, source scope, annotation authority, training budget, or
   product claims.
7. The receipt keeps target-policy status separate from readiness for full
   scratch-trained Detector 0 training/evaluation, browser promotion, final
   gates, or claim expansion.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, packet mutation, tensor work, export, promotion, browser activation,
   or unsupported claim work occurs.
9. A tracked policy artifact, receipt, and numbered session log exist and
   select exactly one next action.
10. The change is committed with a message beginning `mission-3hp:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped target-policy artifact,
  receipt, and log, and selects one allowed next action.
- NUDGE if it misses a required target-policy decision, source/provenance
  separation, forbidden-action proof, changed-file accounting, or exactly one
  next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, source-register mutation, packet mutation,
  tensor/schema mutation, side-worktree merge, export, promotion, browser
  activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, or compute and
  no current strategy memo covers the exact Detector 0 target-policy evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
