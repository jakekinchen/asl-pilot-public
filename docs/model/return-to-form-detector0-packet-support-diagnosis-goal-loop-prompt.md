# Return-To-Form Detector 0 Packet Support Diagnosis Goal Loop Prompt

Mission 3DZ prompt for the Codex executor after M3DY found the approved
Detector 0 objectness packet label-confounded.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev Detector 0 packet-support diagnosis. The
goal is to decide whether the existing approved local packet and manifests can
support class-invariant Detector 0 presence/objectness, or whether the next
useful step requires an explicit human annotation/scope decision.

This is not a training, source-import, or product-promotion mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3DX found scratch hand landmarks technically plausible from public
  manual/human-in-loop sources, but any material source import remains blocked
  on explicit human source/license/import approval.
- M3DY added
  `docs/validation/return-to-form-detector0-objectness-repair-v1.json` and
  found the approved Detector 0 packet is label-confounded for objectness:
  every target-present row is `table`, every target-absent row is a different
  label, and there is no within-label present/absent contrast.
- M3DY selected `continue_detector0_annotation_or_packet_support_no_brev`.
- Crop-normalization ablation is not approved by M3DY because held-out
  presence behavior remains unreliable even when present-row box quality can
  look acceptable.

## Required Slice

Complete exactly one smallest useful packet-support diagnosis:

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
python3 -m json.tool docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
```

2. Inspect the existing approved Detector 0 packet and local approved
   manifests/receipts. Quantify, by split and label:

- target-present rows;
- target-absent rows;
- within-label present/absent contrast;
- non-`table` target-present support;
- candidate rows or clips already represented by approved local artifacts;
- whether any candidate next packet change would require source-register,
  manifest, tensor, vocabulary, or media mutation.

3. Do not train or fit anything. Do not add or modify packet rows in this
   mission. If a helper script is needed, it must be read-only and only write
   the receipt below.

4. Write a tracked receipt:

`docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json`

The receipt must include commands run, files inspected, support tables,
candidate-row inventory, source/register posture, whether a no-source local
packet mutation is possible, exact blockers, claim boundaries, and exactly one
next action.

5. Write a numbered session log:

`docs/session-logs/493-mission-3dz-detector0-packet-support-diagnosis.md`

6. Commit only scoped read-only diagnostic code, receipt, and session-log
   files. Do not push.

## Allowed Next Actions

Select exactly one:

- `prepare_detector0_packet_support_mutation_no_brev`
- `continue_detector0_packet_support_diagnosis_no_brev`
- `return_to_detector0_objectness_repair_after_packet_support`
- `fallback_to_fixed_geometric_regions_until_detector0_data_improves`
- `escalate_detector0_strategy_research`
- `stop_for_human_detector0_annotation_budget`

## Hard Boundaries

- No Brev command, remote compute, source import, source-register mutation,
  media download, manifest mutation, tensor mutation, vocabulary mutation,
  label expansion, or hand-landmark detector training.
- No Detector 0 packet row addition or mutation in this mission.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- No recognizer retraining, Detector 0 training, ONNX export, model-card
  promotion, browser recognition activation, final readiness claim, ASL
  correctness claim, or product runtime change.
- Do not treat M3DX source feasibility as permission to download or train on
  CMU/FreiHAND/InterHand/Voxel51/Ultralytics data.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3DZ.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt quantifies Detector 0 packet support by split/label and
   separates "candidate rows exist" from "objectness training is supportable."
4. The receipt states whether a no-source local packet mutation is possible
   without source-register/manifest/tensor/vocabulary/media mutation, or
   whether human annotation/scope approval is required.
5. No Brev, source import, source mutation, tensor/manifest/vocabulary
   mutation, packet-row mutation, pretrained/generated-label path, export,
   promotion, browser activation, or unsupported product claim occurs.
6. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE only if the receipt produces a concrete next action and preserves
  the no-source/no-Brev/no-training boundary.
- REDIRECT if the executor starts mutating packet/source/manifest/tensor/vocab
  state instead of diagnosing support.
- ESCALATE if local packet support remains ambiguous and the next step would
  change architecture or training strategy.
- STOP if human annotation, source, budget, or scope approval is required
  before any bounded local progress remains possible.
