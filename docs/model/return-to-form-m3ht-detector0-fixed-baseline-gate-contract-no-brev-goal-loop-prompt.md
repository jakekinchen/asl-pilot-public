# Return-To-Form M3HT Detector0 Fixed Baseline Gate Contract No Brev Goal Loop Prompt

Mission 3HT prompt for the Codex executor after M3HS expanded Detector 0
candidate rows and supervisor commit `0379773` added the controlled
full-vs-shortcut Detector 0 bake-off gate.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 fixed-baseline gate contract slice.

The goal is to codify the current fixed-geometry baseline, learned-target
design, M3HS expansion classification, and beat-it success gate into tracked
evidence so future manual annotation, training, export, promotion, or claim
work has a measurable gate.

This mission may create one new contract artifact, one validation receipt, and
one numbered session log. It must not mutate the M3HQ overlay artifact, the
M3HN packet draft, the approved V0 packet, source manifests, source register,
labels, tensors, vocabulary, model cards, runtime code, final gates, claim
surfaces, or side-worktree files. It must not inspect raw learner media, import
media, start or stop Brev, run remote commands, train/evaluate a recognizer,
train Detector 0, export, promote, activate browser recognition, or expand
claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. Supervisor bake-off gate:
   - [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json)
5. M3HS evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json)
   - [`docs/validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json`](../validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json)
   - [`docs/session-logs/703-mission-3hs-detector0-targeted-annotation-packet-expand-no-brev.md`](../session-logs/703-mission-3hs-detector0-targeted-annotation-packet-expand-no-brev.md)
6. M3HR through M3HL Detector 0 evidence:
   - [`docs/model/return-to-form-detector0-overlay-readiness-review-v1.json`](return-to-form-detector0-overlay-readiness-review-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`docs/model/return-to-form-detector0-target-policy-review-v1.json`](return-to-form-detector0-target-policy-review-v1.json)
   - [`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`](return-to-form-detector0-targeted-annotation-packet-plan-v1.json)
   - [`docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`](return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json)
7. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
8. Existing manifest, annotation, source, and review evidence:
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
- The M3HS expansion rows are source-bound candidate references pending manual
  target annotation. They are not new labels, training/evaluation readiness,
  browser-promotion evidence, final-gate evidence, or claim evidence.
- The supervisor bake-off found that learned hands on the current 32-row packet
  do not beat the fixed-geometry baseline on held-out test in 12 seeds.
- The subsequent learned Detector 0 design is: learn `left_or_first_hand` and
  `right_or_second_hand`; keep `head_or_face` and
  `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only and outside promoted
  target IDs.
- A learned Detector 0 may be called an improvement, exported, promoted, or
  activated only after it beats the fixed-box held-out baselines
  `left_or_first_hand > 0.4073` and `right_or_second_hand > 0.6476`, then
  trends toward the product spec gates.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training fixed-baseline gate contract
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
python3 -m json.tool docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json >/dev/null
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

2. Create the tracked fixed-baseline gate contract:

`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`

The contract must:

- include current commit and active prompt;
- list source files inspected and changed files;
- reference the supervisor bake-off receipt, M3HS expansion artifact/receipt,
  M3HR review, M3HQ overlay, M3HN packet, V0 packet, source register, and Tier
  0 manifests with hashes;
- define the fixed-geometry held-out test baselines that must be beaten before
  a learned Detector 0 can be called an improvement: left hand IoU `0.4073` and
  right hand IoU `0.6476`;
- define the learned-target design: learned hands, fixed face/body anchors,
  diagnostic-only table union/contact target;
- classify the M3HS expansion rows as pending manual annotation candidates,
  not training labels or readiness evidence;
- keep source/hard-negative approval gaps separate from packet expansion and
  training readiness;
- record that the fixed-geometry baseline is the operative Detector 0
  comparison baseline, not a browser-promoted learned artifact or claim
  expansion;
- preserve fail-closed claim surfaces and forbid promotion/export/activation
  until the beat-it gate is met by later tracked evidence.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected and changed, source artifact hashes, M3HS expansion
classification, fixed-baseline gate proof, claim-surface proof, forbidden
action proof, readiness classification, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/704-mission-3ht-detector0-fixed-baseline-gate-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hu_detector0_fixed_baseline_gate_contract_review_no_brev`
- `continue_m3hu_detector0_manual_contact_sheet_overlay_packet_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_gate_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, or claim expansion from M3HT. Future compute must be a separate
receipt-backed route and must have explicit human approval before any Brev
lifecycle or remote command runs.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running.
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

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HT.
2. Required local checks pass, or exact blockers are recorded.
3. The supervisor bake-off receipt, M3HS expansion artifact/receipt/log, M3HR
   review, M3HQ overlay, M3HN packet, V0 packet, source register, manifests,
   and current Detector 0 claim surfaces are inspected.
4. A tracked fixed-baseline gate contract is written without mutating overlay,
   packet, source/manifest/tensor/model-card/runtime/final-gate surfaces, or
   claim surfaces.
5. The contract records the learned-target design, fixed anchor decision,
   diagnostic-only table union/contact target, fixed-baseline thresholds, M3HS
   expansion classification, and no-pretrained/source boundaries.
6. The receipt keeps the gate contract separate from full scratch-trained
   Detector 0 training/evaluation, browser promotion, final gates, or claim
   expansion.
7. Brev remains default-off and no lifecycle, remote, training, source/media
   import, base packet/overlay mutation, tensor work, export, promotion,
   browser activation, or unsupported claim work occurs.
8. A tracked contract artifact, receipt, and numbered session log exist and
   select exactly one next action.
9. The change is committed with a message beginning `mission-3ht:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped contract artifact, receipt,
  and log, and selects one allowed next action.
- NUDGE if it misses source hash proof, M3HS expansion classification,
  fixed-baseline threshold proof, forbidden-action proof, changed-file
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
