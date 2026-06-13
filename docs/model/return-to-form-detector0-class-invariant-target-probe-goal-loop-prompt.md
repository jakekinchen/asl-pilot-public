# Return-To-Form Detector 0 Class-Invariant Target Probe Goal Loop Prompt

Mission 3EA prompt for the Codex executor after M3DY/M3DZ showed the
`table_two_hand_union_or_contact_region` objectness lane is label-confounded.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev Detector 0 target-formulation probe that
backtracks from the table-specific union/contact target. The goal is to decide
whether existing approved packet targets that appear across the five-label
Tier 0 set can support a class-invariant scratch Detector 0 localization path
without packet mutation, source import, or remote compute.

This is a local diagnostic/training-smoke mission only. It must not promote a
model, export ONNX, activate browser recognition, claim ASL correctness, or
change product runtime behavior.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- Brev is practically unblocked but default-off: `brev ls --json` currently
  reports `"workspaces": null`; this mission does not authorize worker
  creation or remote training.
- M3DY wrote
  `docs/validation/return-to-form-detector0-objectness-repair-v1.json` and
  found the table union/contact objectness target is label-confounded.
- M3DZ wrote
  `docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json`
  and found a no-source packet mutation is possible, but it requires explicit
  target-scope and annotation-budget decisions before mutating rows.
- The latest user instruction asks the pair to continue toward the full
  product, build detectors and TCN intentionally, use PopSign/SemLex where
  appropriate, backtrack when approaches are not panning out, and be
  intentional about dataset/vocabulary. Treat that as approval to backtrack
  locally from the table-specific target and test a narrower class-invariant
  Detector 0 formulation before spending Brev or mutating packet rows.

## Required Slice

Complete exactly one smallest useful class-invariant target probe:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect the current approved Detector 0 packet:

`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`

Quantify target support for:

- `left_or_first_hand`;
- `head_or_face`;
- `upper_body_or_signing_space`;
- `right_or_second_hand`;
- `table_two_hand_union_or_contact_region`.

3. Add or reuse a scoped local helper if needed. The helper may train/fit a
   random-init scratch local diagnostic model on CPU or MPS, but it must not
   save a model artifact. Prefer the smallest adaptation of the existing
   Detector 0 smoke/probe code over a new framework.

4. The probe must test a class-invariant localization formulation that does not
   use `table_two_hand_union_or_contact_region` as the primary objectness
   target. Acceptable probe targets are the packet targets already present
   across labels, especially `left_or_first_hand`,
   `head_or_face`, and `upper_body_or_signing_space`.

5. The receipt must separate:

- row-level presence metrics, which are not meaningful when a target is present
  for every row;
- spatial target-cell/objectness behavior;
- box localization metrics on held-out rows;
- whether the evidence supports another local Detector 0 formulation slice,
  a packet annotation mutation, a fixed-geometric fallback, or strategy
  research.

6. Write a tracked receipt:

`docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json`

7. Write a numbered session log:

`docs/session-logs/496-mission-3ea-detector0-class-invariant-target-probe.md`

8. Commit only scoped diagnostic code, receipt, and session-log files. Do not
   push.

## Allowed Next Actions

Select exactly one:

- `continue_detector0_class_invariant_probe_no_brev`
- `prepare_detector0_packet_annotation_budget_from_probe`
- `prepare_detector0_fixed_geometric_fallback_no_brev`
- `return_to_detector0_objectness_repair_after_target_probe`
- `escalate_detector0_strategy_research`
- `stop_for_human_detector0_scope_review`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, or reset.
- No source import, source-register mutation, media download, manifest
  mutation, tensor mutation, vocabulary mutation, label expansion, or packet
  row mutation.
- No hand-landmark source import or landmark detector training.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- No recognizer retraining, ONNX export, model-card promotion, browser
  recognition activation, product runtime change, final readiness claim, ASL
  correctness claim, raw learner video upload, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EA.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt quantifies target support across the current packet and does
   not use the table union/contact target as the primary class-invariant
   objectness target.
4. Any local fitting is random-init, local-only, artifact-free, and bounded.
5. The receipt reports held-out spatial/box behavior separately from row-level
   presence accuracy.
6. No Brev/source import/source mutation/manifest mutation/tensor mutation/
   vocabulary mutation/packet-row mutation/pretrained/generated-label path/
   export/promotion/browser activation/product-runtime change/final readiness
   claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE if the receipt produces a concrete local no-Brev next action and
  preserves fail-closed product boundaries.
- REDIRECT if the executor drifts into table-specific objectness repetition,
  packet mutation, product runtime changes, or Brev.
- ESCALATE if local target formulation remains ambiguous and another training
  retry would be guesswork.
- STOP only if the receipt shows no bounded local progress remains without
  human scope, annotation, source, or budget approval.
