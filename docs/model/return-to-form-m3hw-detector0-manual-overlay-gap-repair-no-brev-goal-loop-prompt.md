# Return-To-Form M3HW Detector0 Manual Overlay Gap Repair No Brev Goal Loop Prompt

Mission 3HW prompt for the Codex executor after M3HV wrote the manual
contact-sheet overlay packet and selected
`continue_m3hw_detector0_manual_overlay_gap_repair_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 manual overlay gap-repair slice. The goal is to focus only on the
single M3HV blocked row, `det0-exp1-validation-table-000376-f004`, and decide
whether existing retained visual evidence is sufficient to author supplemental
manual hand targets, or whether the blocker must remain as explicit
insufficient visual evidence.

This mission may create one supplemental gap-repair artifact, one validation
receipt, and one numbered session log. It must not mutate the M3HV manual
overlay packet, M3HT contract, M3HS expansion artifact, M3HQ overlay, M3HN
packet draft, approved V0 packet, source manifests, source register, tensors,
vocabulary, model cards, runtime code, final gates, claim surfaces, or
side-worktree files. It must not inspect raw learner media, import media, start
or stop Brev, run remote commands, train/evaluate a recognizer, train Detector
0, export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HV manual overlay evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json)
   - [`docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json`](../validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json)
   - [`docs/session-logs/708-mission-3hv-detector0-manual-contact-sheet-overlay-packet-no-brev.md`](../session-logs/708-mission-3hv-detector0-manual-contact-sheet-overlay-packet-no-brev.md)
5. M3HU/M3HT fixed-baseline gate evidence:
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json)
   - [`docs/validation/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-v1.json`](../validation/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json)
6. M3HS candidate-row evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json)
   - [`docs/validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json`](../validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json)
7. M3HQ/M3HN/V0 overlay and packet evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json)
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
8. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
9. Existing manifest, source, and review evidence:
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
- The M3HT/M3HU gate is current: learned Detector 0 hand boxes must strictly
  beat held-out fixed baselines left `0.4073` and right `0.6476` before any
  improvement, export, promotion, activation, or claim language.
- Learn `left_or_first_hand` and `right_or_second_hand`; keep `head_or_face`
  and `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only and outside
  promoted Detector 0 target IDs.
- M3HV reviewed all 18 M3HS table temporal-neighbor candidate rows: 17 rows
  received manual hand boxes and one validation row,
  `det0-exp1-validation-table-000376-f004`, remained blocked as
  `insufficient_visual_evidence`.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies,
  generated pseudo-labels, and pretrained feature caches remain forbidden in
  the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training manual overlay gap-repair
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
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json >/dev/null
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

2. Focus only on `det0-exp1-validation-table-000376-f004`:

- inspect only existing approved/tracked PopSign frame, tensor,
  retained contact-sheet, temporal-neighbor, and related reviewed-row evidence;
- if the retained visual evidence is sufficient, author supplemental manual
  `left_or_first_hand` and `right_or_second_hand` targets with normalized
  full-frame top-left `box_xyxy_norm` and `center_xy_norm`, visibility,
  occlusion, truncation, provenance, reviewer, and reviewed-at fields;
- if the retained visual evidence remains insufficient, preserve the blocker
  and record exactly why a safe manual target cannot be authored;
- keep `head_or_face` and `upper_body_or_signing_space` as fixed-anchor policy
  references, not newly learned labels;
- keep `table_two_hand_union_or_contact_region` diagnostic-only if recorded at
  all, derived only from manual hand boxes and never added to promoted target
  IDs.

3. Do not mutate the M3HV manual overlay packet, M3HT contract, M3HS expansion
   artifact, M3HQ overlay, M3HN packet draft, approved V0 packet, source
   manifests, source register, tensors, vocabulary, model cards, runtime code,
   final gates, claim surfaces, or side-worktree files.

4. Write the tracked supplemental gap-repair artifact:

`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json`

The artifact must include:

- current commit and active prompt;
- source files inspected and changed files;
- M3HV packet, receipt, and session log path/hash references;
- the blocked row id and original M3HV blocker classification;
- visual evidence inspected, including any temporal-neighbor or related-row
  evidence used as non-authoritative visual context;
- either supplemental manual target payloads for both hands, or a preserved
  insufficient-visual-evidence blocker with a concrete reason;
- fixed-anchor policy references for `head_or_face` and
  `upper_body_or_signing_space`;
- diagnostic-only table union/contact-region policy, if applicable;
- source-rights and no-pretrained attestations;
- readiness classification that keeps gap-repair status separate from full
  scratch-trained Detector 0 training/evaluation, browser promotion, final
  gates, or claim expansion;
- exactly one recommended next action.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected and changed, supplemental artifact hash, blocked-row
disposition, target-by-target result, M3HT gate continuity proof,
source/provenance/no-pretrained proof, claim-surface proof, forbidden-action
proof, readiness classification, and exactly one next action.

6. Verify:

```sh
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json >/dev/null
git diff --check
```

7. Write:

`docs/session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hx_detector0_manual_overlay_gap_review_no_brev`
- `continue_m3hx_detector0_manual_overlay_packet_consolidation_no_brev`
- `continue_m3hx_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_manual_overlay_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, final-gate change, or claim expansion from M3HW. Future compute
must be a separate receipt-backed route and must have explicit human approval
before any Brev lifecycle or remote command runs.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running. If it reports a running worker, record that as a cost-control
  blocker for observer handling; do not run Brev lifecycle or remote commands
  from this executor slice.
- No recognizer training/evaluation, Detector 0 training, evaluator rerun,
  threshold tuning, source/media import, raw learner media inspection,
  source-register mutation, packet/overlay/base-artifact mutation, tensor work,
  vocabulary mutation, model-card or claim-surface mutation, final-gate change,
  export, ONNX, browser artifact promotion, browser recognition activation,
  push, amend, or no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be counted as offline supervision targets only when rights
  and provenance are recorded.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HW.
2. Required local checks pass, or exact blockers are recorded.
3. M3HV packet/receipt/log, M3HU review, M3HT contract/gate, M3HS candidate
   rows, M3HQ overlay, M3HN packet, V0 packet, source register, manifests, and
   current Detector 0 claim surfaces are inspected.
4. A tracked supplemental gap-repair artifact is written without mutating the
   M3HV packet or any M3HT/M3HS/M3HQ/M3HN/V0/source/manifest/tensor/model-card/
   runtime/final-gate/claim surfaces.
5. The artifact records a clear disposition for
   `det0-exp1-validation-table-000376-f004`: supplemental manual hand targets
   when visual evidence is sufficient, or an explicit preserved
   insufficient-visual-evidence blocker when it is not.
6. The artifact preserves the learned-hands/fixed-face-body/diagnostic-table
   target design and the fixed-baseline beat-it gate.
7. The receipt keeps gap-repair status separate from full scratch-trained
   Detector 0 training/evaluation, browser promotion, final gates, or claim
   expansion.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, base-artifact mutation, tensor work, export, promotion, browser
   activation, or unsupported claim work occurs.
9. A tracked supplemental artifact, receipt, and numbered session log exist and
   select exactly one next action.
10. The change is committed with a message beginning `mission-3hw:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped supplemental gap-repair
  artifact, receipt, and log, and selects one allowed next action.
- NUDGE if it misses blocked-row disposition, target/absence decisions,
  fixed-baseline gate continuity, source/provenance/no-pretrained proof,
  changed-file accounting, forbidden-action proof, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, source-register mutation, base-artifact mutation,
  tensor/schema mutation, export, promotion, browser activation, or claim
  expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, compute, or
  product claims beyond the M3HT/M3HU/M3HV evidence and no current strategy memo
  covers the exact local evidence.
- STOP if the selected next action requires human source, label, annotation,
  schema, compute, privacy, claim, strategy, or final-submission approval.
