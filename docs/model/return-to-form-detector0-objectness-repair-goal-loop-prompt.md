# Return-To-Form Detector 0 Objectness Repair Goal Loop Prompt

Mission 3DY prompt for the Codex executor after M3DX found scratch hand
landmarks technically plausible but source/license/import-blocked.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev Detector 0 objectness repair slice. The
goal is to improve or decisively classify the current scratch Detector 0
presence/objectness formulation before any crop-normalization ablation,
recognizer retraining, hand-landmark import, or browser promotion.

This is not a hand-landmark source mission. Do not import any public landmark
dataset or train a landmark detector.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3DU/M3DV proved the region-grid TCN route can run on CUDA but did not
  generalize enough to promote.
- M3DX proved public manual/human-in-loop hand-landmark sources exist as
  plausible future complements, but stopped for human source/license/import
  approval. That approval is not granted by this prompt.
- The latest Detector 0 held-out receipt selected
  `fix_detector0_presence_objectness_formulation_no_brev`.
- `docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json`
  classifies the blocker as
  `target_objectness_formulation_deficiency_remains`.
- The useful next move is a local code/diagnostic repair against the existing
  approved Detector 0 packet, not another broad recognizer run and not a new
  source import.

## Required Slice

Complete exactly one smallest useful Detector 0 objectness repair:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_return_to_form_tier0_detector0_parallel_heldout_recall.py
```

2. Inspect the existing Detector 0 packet, runner, and prior receipt. Identify
   whether the current issue is:

- target-cell versus max-map presence scoring;
- hard-negative pressure or loss weighting;
- threshold/calibration design;
- lack of a true global presence objective;
- data support too sparse for another local formulation attempt.

3. Make one scoped local repair or diagnostic improvement to the Detector 0
   objectness runner or a closely related helper. Prefer a minimal change that
   makes future evidence clearer over a broad rewrite. Good candidates include:

- a corrected presence score formulation separated from localization heatmap
  peak selection;
- explicit validation/test threshold-free ranking or PR/AUC evidence;
- clearer hard-negative weighting diagnostics;
- a local variant that can prove whether global presence is separable from box
  regression.

4. Run only bounded local CPU/MPS diagnostics against the existing approved
   packet. Keep compute small:

- no Brev;
- no more than three short variants;
- no broad sweeps;
- no source/media/manifest/tensor/vocabulary mutation.

5. Write a tracked receipt:

`docs/validation/return-to-form-detector0-objectness-repair-v1.json`

The receipt must include commands run, code/files changed, variant bounds,
train/validation/test presence metrics, score distributions, false positives
and false negatives, presence versus box-quality separation, comparison to the
parallel held-out recall receipt, no-pretrained/no-Brev/no-import proof,
claim boundary, blockers, and exactly one next action.

6. Write a numbered session log:

`docs/session-logs/491-mission-3dy-detector0-objectness-repair.md`

7. Commit only scoped Detector 0 code, receipt, and session-log files. Do not
push.

## Allowed Next Actions

Select exactly one:

- `continue_detector0_objectness_repair_no_brev`
- `prepare_detector0_crop_normalization_ablation_after_presence_signal`
- `continue_detector0_annotation_or_packet_support_no_brev`
- `fallback_to_fixed_geometric_regions_until_detector0_data_improves`
- `escalate_detector0_strategy_research`
- `stop_for_human_detector0_scope_or_annotation_budget`

## Hard Boundaries

- No Brev command, remote compute, source import, source-register mutation,
  media download, manifest mutation, tensor mutation, vocabulary mutation,
  label expansion, or hand-landmark detector training.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- No recognizer retraining, ONNX export, model-card promotion, browser
  recognition activation, final readiness claim, ASL correctness claim, or
  product runtime change.
- Do not treat M3DX source feasibility as permission to download or train on
  CMU/FreiHAND/InterHand/Voxel51/Ultralytics data.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3DY.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The slice directly addresses Detector 0 presence/objectness formulation,
   not broad recognizer metrics.
4. The receipt separates presence signal from box-regression quality and
   records held-out positive/negative score behavior.
5. No Brev, source import, source mutation, tensor/manifest mutation,
   pretrained/generated-label path, export, promotion, browser activation, or
   unsupported product claim occurs.
6. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE only if the receipt produces a concrete next action and preserves
  the no-source/no-Brev boundary.
- NUDGE if metrics are aggregate-only or presence/box quality are conflated.
- REDIRECT if the executor drifts into landmark-source import, broad
  recognizer training, or browser promotion.
- ESCALATE if repeated local objectness repairs remain inconclusive.
- STOP only if a human Detector 0 annotation/scope decision is required before
  any bounded local progress remains possible.
