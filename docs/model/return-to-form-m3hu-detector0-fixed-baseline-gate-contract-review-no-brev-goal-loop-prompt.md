# Return-To-Form M3HU Detector0 Fixed Baseline Gate Contract Review No Brev Goal Loop Prompt

Mission 3HU prompt for the Codex executor after M3HT codified the Detector 0
fixed-baseline gate contract and selected
`continue_m3hu_detector0_fixed_baseline_gate_contract_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 fixed-baseline gate contract review slice.

The goal is to decide whether the M3HT contract is internally consistent and
usable as the current gate for future manual annotation, training, export,
promotion, or claim work. Keep that review separate from adding labels,
training/evaluation, browser promotion, final gates, or claim expansion.

This mission may create one contract-review artifact, one validation receipt,
and one numbered session log. It must not mutate the M3HT contract, the M3HQ
overlay artifact, the M3HN packet draft, the approved V0 packet, source
manifests, source register, labels, tensors, vocabulary, model cards, runtime
code, final gates, claim surfaces, or side-worktree files. It must not inspect
raw learner media, import media, draw boxes, start or stop Brev, run remote
commands, train/evaluate a recognizer, train Detector 0, export, promote,
activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HT evidence:
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json`](../validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json)
   - [`docs/session-logs/704-mission-3ht-detector0-fixed-baseline-gate-contract-no-brev.md`](../session-logs/704-mission-3ht-detector0-fixed-baseline-gate-contract-no-brev.md)
5. Supervisor bake-off gate:
   - [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json)
6. M3HS evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json)
   - [`docs/validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json`](../validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json)
   - [`docs/session-logs/703-mission-3hs-detector0-targeted-annotation-packet-expand-no-brev.md`](../session-logs/703-mission-3hs-detector0-targeted-annotation-packet-expand-no-brev.md)
7. M3HR through M3HL Detector 0 evidence:
   - [`docs/model/return-to-form-detector0-overlay-readiness-review-v1.json`](return-to-form-detector0-overlay-readiness-review-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`docs/model/return-to-form-detector0-target-policy-review-v1.json`](return-to-form-detector0-target-policy-review-v1.json)
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

## Current Detector 0 State

Treat these facts as current unless live tracked evidence proves otherwise:

- Detector 0 is not trained, accurate, or spec-fit today.
- `web/public/model/detector0-card.json` remains `status: "not_trained"`,
  `promotion_state: "research_only"`, with `browser_artifact: null`.
- M3HT codified the fixed-geometry held-out baselines that must be beaten
  before a learned Detector 0 can be called an improvement: left hand IoU
  `0.4073` and right hand IoU `0.6476`.
- The learned-target design remains: learn `left_or_first_hand` and
  `right_or_second_hand`; keep `head_or_face` and
  `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only and outside
  promoted target IDs.
- M3HS expansion rows are source-bound pending manual annotation candidates
  only. They are not labels, training/evaluation readiness, browser promotion
  evidence, final-gate evidence, or claim evidence.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training fixed-baseline gate contract
review slice:

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
python3 -m json.tool docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-overlay-readiness-review-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool web/public/model/browser-model-bundle.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
brev ls --json
git diff --check
```

2. Review the M3HT contract without mutating it:

- verify the contract and receipt agree on source hashes, changed files,
  command statuses, Brev read-only/default-off state, and forbidden-action
  proof;
- verify the fixed-baseline thresholds match the supervisor bake-off receipt:
  `left_or_first_hand > 0.4073` and `right_or_second_hand > 0.6476`;
- verify the learned-target design keeps hands learned, face/body fixed, and
  the table union/contact target diagnostic-only;
- verify the M3HS expansion is classified as pending manual annotation
  candidates with zero verified new target annotations;
- verify source/hard-negative approval gaps remain separate from packet
  expansion, contract review, and training readiness;
- verify fail-closed claim surfaces are unchanged;
- classify any gap as either contract-gap repair, manual annotation packet
  authoring, source/hard-negative review, human approval, or research
  escalation.

3. Do not mutate the M3HT contract, M3HS expansion artifact, M3HQ overlay, M3HN
   packet draft, V0 packet, source manifests, source register, labels, tensors,
   vocabulary, model cards, runtime code, final gates, claim surfaces, or
   side-worktree files. Do not inspect raw learner media or import media.

4. Write the tracked review artifact:

`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json`

The artifact must include:

- current commit and active prompt;
- source files inspected and changed files;
- M3HT contract, receipt, and session log path/hash references;
- supervisor bake-off threshold proof;
- learned-target design proof;
- M3HS expansion classification proof;
- claim-surface proof;
- forbidden-action proof;
- remaining gaps before manual annotation, source/hard-negative review,
  training/evaluation, browser promotion, final gates, or claim expansion;
- exactly one recommended next action.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected and changed, contract-review artifact hash,
fixed-baseline threshold proof, target-design proof, M3HS expansion
classification proof, claim-surface proof, forbidden-action proof, readiness
classification, and exactly one next action.

6. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-v1.json >/dev/null
git diff --check
```

7. Write:

`docs/session-logs/706-mission-3hu-detector0-fixed-baseline-gate-contract-review-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hv_detector0_manual_contact_sheet_overlay_packet_no_brev`
- `continue_m3hv_detector0_source_or_hard_negative_review_no_brev`
- `continue_m3hv_detector0_fixed_baseline_gate_contract_gap_repair_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_gate_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, or claim expansion from M3HU. Future compute must be a separate
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

1. `GOAL.md` points at this prompt and names Mission 3HU.
2. Required local checks pass, or exact blockers are recorded.
3. M3HT contract/receipt/log, supervisor bake-off receipt, M3HS expansion
   artifact/receipt/log, M3HR review, M3HQ overlay, M3HN packet, V0 packet,
   source register, manifests, and current Detector 0 claim surfaces are
   inspected.
4. A tracked contract-review artifact is written without mutating the M3HT
   contract, overlay, packet, source/manifest/tensor/model-card/runtime/
   final-gate surfaces, or claim surfaces.
5. The review verifies fixed-baseline thresholds, learned-target design, M3HS
   expansion classification, source/hard-negative gap separation, and
   fail-closed claim surfaces.
6. The receipt keeps contract-review status separate from full scratch-trained
   Detector 0 training/evaluation, browser promotion, final gates, or claim
   expansion.
7. Brev remains default-off and no lifecycle, remote, training, source/media
   import, packet/overlay mutation, tensor work, export, promotion, browser
   activation, or unsupported claim work occurs.
8. A tracked review artifact, receipt, and numbered session log exist and
   select exactly one next action.
9. The change is committed with a message beginning `mission-3hu:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped review artifact, receipt, and
  log, and selects one allowed next action.
- NUDGE if it misses threshold proof, M3HS expansion classification,
  source/hard-negative gap separation, forbidden-action proof, changed-file
  accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, source-register mutation, packet/overlay mutation,
  tensor/schema mutation, export, promotion, browser activation, or claim
  expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, compute, or
  product claims beyond the supervisor bake-off gate and no current strategy
  memo covers the exact local evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
