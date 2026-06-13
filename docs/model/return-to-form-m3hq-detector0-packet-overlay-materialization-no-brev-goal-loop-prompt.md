# Return-To-Form M3HQ Detector0 Packet Overlay Materialization No Brev Goal Loop Prompt

Mission 3HQ prompt for the Codex executor after M3HP reviewed Detector 0 target
policy and selected
`continue_m3hq_detector0_packet_overlay_materialization_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 packet overlay materialization slice. The goal is to materialize the
per-row source/license, provenance, no-pretrained, coordinate-space,
`absence_reason`, and `target_applicability` overlays that M3HN and M3HO left
as blockers, using only the current M3HN review-ready row references, existing
approved V0 packet rows, and the M3HP target-policy artifact.

This mission may create one new overlay artifact, one validation receipt, and
one numbered session log. It must not mutate the M3HN packet draft, the
existing approved V0 packet, source manifests, source register, labels,
tensors, model cards, runtime code, final gates, claim surfaces, or
side-worktree files. It must not inspect raw learner media, import media, draw
new boxes from raw video, start or stop Brev, run remote commands,
train/evaluate a recognizer, train Detector 0, export, promote, activate
browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HP evidence:
   - [`docs/model/return-to-form-detector0-target-policy-review-v1.json`](return-to-form-detector0-target-policy-review-v1.json)
   - [`docs/validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json`](../validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json)
   - [`docs/session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md`](../session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md)
5. M3HO evidence:
   - [`docs/validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json`](../validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json)
   - [`docs/session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md`](../session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md)
6. M3HN packet evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`docs/validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json`](../validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json)
   - [`docs/session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md`](../session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md)
7. M3HM plan and M3HL contract:
   - [`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`](return-to-form-detector0-targeted-annotation-packet-plan-v1.json)
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
- M3HP resolved target policy only for no-Brev overlay materialization of the
  current M3HN review-ready rows. It did not make the packet ready for full
  scratch Detector 0 training/evaluation, browser promotion, final gates, or
  claim expansion.
- Current promoted target IDs remain `left_or_first_hand`,
  `right_or_second_hand`, `head_or_face`, and
  `upper_body_or_signing_space`.
- `table_two_hand_union_or_contact_region` remains auxiliary/table-scoped only
  and outside detector-card target IDs.
- Current non-table `right_or_second_hand` `presence=false` rows should be
  materialized as `true_absent` with
  `absence_reason=reviewed_not_visible_in_frame` and
  `target_applicability=promoted_visual_target_applicable_if_visible`.
- Current non-table `table_two_hand_union_or_contact_region` `presence=false`
  rows should be materialized with
  `absence_reason=outside_auxiliary_table_contact_target_scope` and
  `target_applicability=not_applicable_by_label`.
- `normalized_full_frame_xyxy_top_left_origin` is an allowed source alias for
  canonical `normalized_full_frame_top_left_xyxy`; future overlay rows should
  emit the canonical coordinate-space name and retain the alias as provenance.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training overlay-materialization slice:

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

2. Write the tracked overlay artifact:

`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`

The artifact must:

- include current commit and active prompt;
- list source files inspected and changed files;
- reference the M3HN packet, M3HP policy artifact, M3HO receipt, and V0 packet
  with hashes;
- materialize exactly the current M3HN review-ready row IDs unless a mismatch
  is recorded as a blocker;
- preserve row provenance from the V0 packet: row id, clip id, label id, split,
  source id, source record id, source video hash, signer hash, frame index,
  timestamp, tensor path/hash, label source, annotation source, annotator,
  reviewer, reviewed timestamp, and review status;
- materialize per-row source/license overlays from the packet/source register:
  source license decision, source license review status, allowed model-training
  and validation flags, allowed label/annotation scope, and any source-specific
  derivative restrictions;
- materialize `pretrained_or_generated_label_use=false` and a no-pretrained
  attestation for every row;
- copy existing reviewed target payloads without redrawing boxes or inspecting
  raw media;
- add canonical `coordinate_space=normalized_full_frame_top_left_xyxy` to each
  row and retain any source alias as provenance;
- add `target_applicability` for every target and `absence_reason` whenever
  `presence=false`, following the M3HP policy;
- keep `table_two_hand_union_or_contact_region` auxiliary/table-scoped and out
  of promoted Detector 0 card target IDs;
- include target-by-target present/absent/applicability counts by split;
- classify remaining gaps before full training/evaluation, browser promotion,
  final gates, or claim expansion.

3. Do not mutate the M3HN packet draft, the existing V0 packet, source
   manifests, source register, labels, tensors, vocabulary, model cards,
   runtime code, final gates, or side-worktree files. Do not inspect raw
   learner media or import media. Do not create a training manifest unless this
   prompt is later replaced by an approved manifest-readiness prompt.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- Brev default-off read-only inventory;
- files inspected and changed files;
- M3HP policy artifact path/hash and applied policy summary;
- M3HN packet path/hash and row-reference proof;
- V0 packet path/hash and row copy/source provenance proof;
- overlay artifact path/hash;
- target-by-target overlay counts and absence/applicability decisions;
- source/provenance/no-pretrained requirements;
- forbidden-action proof;
- claim-surface proof;
- readiness classification that remains separate from training/evaluation,
  browser promotion, final gates, or claim expansion;
- exactly one next action.

5. After writing the artifact and receipt, verify:

```sh
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json >/dev/null
git diff --check
```

6. Write:

`docs/session-logs/699-mission-3hq-detector0-packet-overlay-materialization-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hr_detector0_targeted_annotation_packet_expand_no_brev`
- `continue_m3hr_detector0_source_or_hard_negative_review_no_brev`
- `continue_m3hr_detector0_overlay_readiness_review_no_brev`
- `stop_for_human_detector0_target_schema_or_annotation_policy_approval`
- `stop_for_human_detector0_source_or_label_approval`
- `escalate_detector0_overlay_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, or claim expansion from M3HQ. Future compute must be a separate
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
  tensor/materialization mutation beyond the new overlay JSON artifact,
  vocabulary mutation, model-card mutation, runtime claim-surface mutation,
  export, ONNX, browser artifact promotion, browser recognition activation,
  final gate weakening, push, amend, or no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be counted as offline supervision targets only when rights
  and provenance are recorded.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HQ.
2. Required local checks pass, or exact blockers are recorded.
3. M3HP policy, M3HO receipt/log, M3HN packet/receipt/log, M3HM plan, M3HL
   contract, V0 packet, source register, manifests, and current Detector 0
   claim surfaces are inspected.
4. A tracked overlay artifact is written without mutating the M3HN packet
   draft, V0 approved packet, or source/manifest/tensor/model-card/runtime/
   final-gate surfaces.
5. The overlay artifact materializes source/license, provenance,
   no-pretrained, coordinate-space, absence-reason, and target-applicability
   fields for the current review-ready row references, or records exact
   blockers.
6. The artifact preserves promoted target IDs and keeps the auxiliary table
   target table-scoped only.
7. The receipt keeps overlay status separate from readiness for full
   scratch-trained Detector 0 training/evaluation, browser promotion, final
   gates, or claim expansion.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, packet mutation, tensor work beyond the new overlay JSON, export,
   promotion, browser activation, or unsupported claim work occurs.
9. A tracked overlay artifact, receipt, and numbered session log exist and
   select exactly one next action.
10. The change is committed with a message beginning `mission-3hq:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped overlay artifact, receipt,
  and log, and selects one allowed next action.
- NUDGE if it misses a required overlay field, row-reference proof, source/
  provenance separation, forbidden-action proof, changed-file accounting, or
  exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, source-register mutation, packet mutation, tensor/schema
  mutation outside the new overlay JSON, side-worktree merge, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, compute, or
  product claims and no current strategy memo covers the exact local evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
