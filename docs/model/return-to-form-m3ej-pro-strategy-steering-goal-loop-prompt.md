# Return-To-Form M3EJ Pro Strategy Steering Goal Loop Prompt

Mission 3EJ prompt for the Codex executor after the supervising user asked to
apply the GPT Pro strategy result to ASL Pilot's goals, milestones, and
development steering.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Convert the GPT Pro strategy result into durable repo steering. This is a
local/no-spend, no-training, no-implementation planning and control-surface
mission.

The strategic decision is:

1. Ship or refresh the fail-closed non-recognition MVP as the deadline product.
2. Treat M3EH/M3EH-R as infrastructure preflight only.
3. Do not run another broad PopSign Fresh5 fit as currently framed.
4. Require Tiny2/Tiny3 gated signal proof before any further recognizer Brev
   spend.
5. Treat Detector 0/source/region evidence as the durable representation path.

## Evidence To Preserve

- M3DU proved remote CUDA training/evaluation plumbing but produced weak,
  non-promotable metrics: validation top-1 `0.2593`, validation macro-F1
  `0.1536`, test top-1 `0.1786`, test macro-F1 `0.0978`, selected threshold
  `0.28`, and test false-pass rate `0.0357`.
- M3EF compared materialized upper-body/head input against full-frame reference
  on the same five labels, splits, seed, and cap. Materialized train top-1 was
  `0.216`, full-frame train top-1 was `0.208`, chance was `0.2`, neither arm
  passed train sanity, and predictions collapsed.
- M3EG blocked another autonomous training-style retry pending human strategy
  approval or new evidence.
- The GPT Pro result treats those metrics as real negative evidence, not noise.
- The browser product remains fail-closed: model card status `not_trained`,
  active labels `[]`, and browser recognition inactive.

## Required Slice

Complete exactly one smallest useful steering update:

1. Verify state:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
git diff --check
```

2. Update durable steering:

- `GOAL.md` must point at this prompt and name Mission 3EJ.
- `docs/model/return-to-form-plan.md` must record the new strategy priority.
- The old broad M3EI Fresh5 fit prompt must be demoted or superseded so it is
  not usable as autonomous training authorization.
- A follow-on Tiny2/Tiny3 gated proof prompt must exist.

3. Write a tracked receipt:

`docs/validation/return-to-form-m3ej-pro-strategy-steering-v1.json`

The receipt must include:

- GPT Pro strategy summary and whether it was advisory;
- local evidence summary from M3DU, M3EF, M3EG, M3EH/M3EH-R;
- current fail-closed product claim surface;
- priority order for development;
- stop/continue criteria for M3EH/M3EH-R and any M3EI-style fit;
- Tiny2/Tiny3 entry gates, abort gates, promotion gates, source/licensing
  gates, and browser parity gates;
- what evidence would justify more Brev spend;
- allowed and forbidden fail-closed product claims;
- files changed;
- negative authorizations;
- exactly one next action.

4. Write a numbered session log:

`docs/session-logs/516-supervisor-activate-pro-strategy-steering.md`

5. Commit only scoped steering documents.

## Required Strategy Content

The steering must encode these gates before future compute:

- Entry gates for any Tiny2/Tiny3 run:
  - source/licensing receipt for every active label;
  - label separability receipt using source counts and visual/phonological
    distance where available;
  - signer-separated splits where applicable;
  - one-batch overfit reaches at least `0.95` train accuracy on a tiny canonical
    subset;
  - label-shuffle negative control fails to learn;
  - predictions are not collapsed;
  - browser export/parity instrumentation is planned before training.
- Abort gates:
  - train top-1 remains near chance plus less than 10 percentage points after a
    serious checkpoint;
  - any single predicted class dominates more than 65-70 percent of
    predictions;
  - macro-F1 remains below `0.35` after the model clearly fits training batches;
  - loss does not move below the random baseline `log(K)`;
  - low false-pass is achieved only by refusing almost everything.
- Promotion discussion gates:
  - Tiny2/Tiny3 signer-independent test macro-F1 at least `0.80`;
  - per-label correct-pass rate at least `0.60`;
  - pass precision at least `0.97`;
  - false-pass rate at most `0.02`;
  - no collapsed class;
  - Python/browser parity, latency, bundle-size, model-card, active-label, and
    claim-surface receipts.

## Allowed Next Actions

Select exactly one:

- `continue_fail_closed_mvp_package_refresh`
- `continue_tiny2_tiny3_gated_proof_preparation_no_brev`
- `continue_detector0_source_region_receipts_no_brev`
- `stop_for_human_product_scope_review`
- `stop_for_brev_provider_cost_control`

## Hard Boundaries

- No Brev exec/sync/copy/start/stop/delete/reset/lifecycle command.
- No training, fitting, evaluation rerun, backward pass, optimizer step,
  checkpoint creation, model artifact, ONNX export, model-card promotion,
  browser recognition activation, product runtime change, final-readiness
  claim, ASL-correctness claim, or raw learner video upload.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion,
  packet-row mutation, generated pseudo-labels, or SemLex media use.
- No pretrained detector, landmark, backbone, embedding, feature extractor,
  teacher-logit, YOLO, MediaPipe, OpenPose, CLIP, SAM, DINO,
  `from_pretrained`, `pretrained=True`, or similar shortcut.
- No push, amend, no-verify, duplicate worker, worker delete, or worker reset.

## Observer Guidance

- CONTINUE if the receipt and docs make the fail-closed MVP and Tiny2/Tiny3
  gated proof path explicit while preserving no-training/no-spend boundaries.
- NUDGE if any gate, claim boundary, source/licensing condition, Brev-spend
  condition, or selected next action is missing.
- REDIRECT if the executor leaves the old broad Fresh5 fit prompt usable as an
  autonomous training authorization.
- STOP if the selected next action needs human product scope, source, or budget
  approval.
- ESCALATE only if new evidence contradicts the GPT Pro strategy or the
  fail-closed claim boundary.

## Progress Ledger

```text
Current state:        Mission 3EJ pro strategy steering.
Completed:            <steering docs and receipt>.
Evidence:             <receipt path and audits>.
Remaining:            <exact next action>.
Blockers:             <none or exact human/budget/source blocker>.
Next step:            <exactly one allowed next action>.
Checkpoint commit:    <commit hash or pending>.
```
