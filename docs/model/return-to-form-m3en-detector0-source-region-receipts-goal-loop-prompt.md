# Return-To-Form M3EN Detector 0 Source-Region Receipts Goal Loop Prompt

Mission 3EN prompt for the Codex executor after Mission 3EM selected
`continue_detector0_source_region_receipts_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one local/no-Brev/no-training Detector 0/source-region receipt packet
from existing approved artifacts. The goal is to connect the M3EM Tiny2
held-out collapse back to the existing Detector 0, fixed-region, source, and
region-grid evidence before any further fitting or compute.

This is an evidence-assembly and routing mission. It is not recognizer
training, Detector 0 training, packet mutation, source import, export, browser
activation, product-runtime work, ASL-correctness proof, or final-readiness
proof.

## Current Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3EM completed at commit `e9497b5` with receipt
  [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json)
  and selected exactly one next action:
  `continue_detector0_source_region_receipts_no_brev`.
- M3EM fit the local random-init Tiny2 train split (`train_accuracy: 1.0`) but
  held-out validation stayed at chance (`0.5`), collapsed all 8 predictions to
  `hello`, and produced zero recall for `table`. It blocks a future open-set
  threshold probe.
- M3EK/M3EL/M3EM used ASL Citizen high-signal region-grid tensors for
  `table` and `hello` with input contract `rgb_regions_grid_v1`. M3EM records
  official validation split held-out evidence and empty train/held-out signer
  overlap.
- Earlier Detector 0 receipts found that the current packet is not sufficient
  for class-invariant objectness:
  `return-to-form-detector0-objectness-repair-v1.json` showed packet presence
  is label-confounded, and
  `return-to-form-detector0-packet-support-diagnosis-v1.json` found candidate
  clips exist but a future packet-row mutation needs explicit annotation/scope
  approval.
- Fixed-geometry/materialized-region receipts remain diagnostic evidence only:
  exact M3EB ROI was reduced to accounting evidence, materialized
  `upper_body_signing_space`/`head_context` tensors are consistent, and M3EF
  did not find clear enough model-input signal to justify another training
  retry.
- The GPT Pro/M3EJ strategy still controls: preserve the fail-closed MVP,
  treat M3EH/M3EH-R as infrastructure-only, require tiny-proof gates before
  recognizer Brev spend, and use Detector 0/source/region receipts as the
  durable representation path.

## Required Slice

Complete exactly one smallest useful source-region receipt packet:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect existing approved artifacts only. At minimum include:

- M3EM, M3EL, M3EK tiny-proof receipts;
- Detector 0 packet/objectness/support/class-invariant/fixed-geometry receipts;
- fixed-geometric claim-reduction and materialized-region receipts;
- `docs/model/dataset-source-register.json`;
- high-signal region-grid train/validation manifest metadata for `table` and
  `hello`;
- model-card and active-vocabulary claim surfaces.

3. Build one receipt that answers:

- what the M3EM `table` held-out collapse says and does not say;
- whether the `table` failure lines up with existing Detector 0 packet target,
  source, region, crop, signer/split, or input-contract evidence;
- whether existing source/register posture and manifest/tensor hashes support
  another no-source local receipt/candidate review;
- whether current Detector 0 packet evidence is still blocked by annotation
  target scope rather than command mechanics;
- whether fixed/materialized region evidence can be used only as diagnostic
  accounting, not product authority;
- whether the next useful step is a bounded local no-source Detector 0/source
  review, a fixed-region input-contract repair, a fail-closed MVP package
  refresh, or a human annotation/strategy STOP.

4. Do not train, fit, evaluate, rerun M3EM, mutate packet rows, mutate source
   registers, mutate manifests, mutate tracked tensors, broaden labels, import
   media, or create model artifacts. A helper is allowed only if it is read-only
   and writes the receipt below.

5. Write a tracked receipt:

`docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`

The receipt must include commands run, files inspected, artifact hashes or
receipt hashes where practical, M3EM failure summary, Detector 0 support
summary, source/register posture, region/crop claim boundaries, negative
authorizations, changed files, and exactly one next action.

6. Write a numbered session log and commit only scoped read-only helper,
   receipt, and session-log files. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_detector0_table_region_candidate_review_no_brev`
- `continue_fixed_region_input_contract_repair_no_brev`
- `continue_fail_closed_mvp_package_refresh_no_brev`
- `stop_for_human_detector0_annotation_budget`
- `stop_for_human_strategy_review`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, reset, or spend.
- No recognizer training/fitting/evaluation rerun, Detector 0 training,
  architecture search, hyperparameter sweep, repeated rerun, checkpoint/model
  artifact, ONNX export, browser asset, model-card update, active-label update,
  browser recognition activation, product runtime change, ASL-correctness
  claim, final-readiness claim, raw learner video upload, or push.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion,
  packet-row mutation, generated labels, pseudo-labels, or pretrained
  dependency.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated-label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- Do not treat M3EM train memorization as product readiness or Brev
  authorization.
- Do not treat fixed/materialized region accounting as runtime Detector 0,
  hand tracking, ASL correctness, browser recognition, or final readiness.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EN.
2. Required audits and JSON validations pass or exact blockers are recorded.
3. The receipt uses existing approved artifacts only and records the M3EM
   held-out collapse as evidence against another threshold/open-set probe.
4. The receipt connects M3EM `table`/`hello` evidence to Detector 0/source/
   region/fixed-geometry evidence without mutating data or training anything.
5. The receipt separates "candidate source/region evidence exists" from "the
   Detector 0 target schema is supportable now."
6. Fail-closed browser/model claim surfaces remain unchanged.
7. No Brev, source import, source/manifest/tensor/vocabulary/packet mutation,
   training/fitting/evaluation rerun, model artifact, pretrained/generated-label
   path, export, promotion, browser activation, product runtime change,
   unsupported claim, or push occurs.
8. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE if the receipt produces one concrete bounded no-Brev next action and
  preserves all fail-closed/no-source/no-training boundaries.
- NUDGE if artifact hashes, M3EM failure interpretation, Detector 0 support
  summary, source/register posture, claim boundaries, negative authorizations,
  changed files, or exactly one next action are missing.
- REDIRECT if the executor starts training/fitting/evaluation, mutates data or
  packet state, broadens labels, revives old Fresh5/Brev prompts, or treats
  source-region evidence as product authority.
- STOP if the receipt shows the next useful step requires human annotation,
  source, target-scope, strategy, product, or compute approval.
- ESCALATE if the executor proposes a new architecture/input representation or
  another training-style retry after the M3EM collapse.
