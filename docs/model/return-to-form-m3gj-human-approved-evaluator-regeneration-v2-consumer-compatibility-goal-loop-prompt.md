# Return-To-Form M3GJ Human-Approved Evaluator Regeneration And V2 Consumer Compatibility Goal Loop Prompt

Mission 3GJ prompt for the Codex executor after M3GI stopped for human
approval and the latest supervising-user instruction explicitly approved
continuing the overnight completion push.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Use the human approval recorded in the latest supervising-user instruction to
complete the next local evidence step after M3GI:

1. patch local raw-frame prediction-sidecar consumers so they accept both v1
   and the repaired v2 sidecar contract; and
2. run the previously approved local M3GB evaluator output-regeneration command
   exactly once against the existing copied-back M3GB checkpoint.

This mission turns the M3GH sidecar-contract repair into usable diagnostic
JSON. It is not training, not Brev compute, not model-card promotion, not
browser recognition activation, and not final readiness.

The latest supervising-user instruction also authorizes continued bounded Brev
usage for the overnight completion push, with the previously discussed total
compute budget context of up to about $250. M3GJ must record that approval for
the next compute route, but M3GJ itself stays local-only. A later prompt must
still name the exact Brev command, max runtime, max spend, kill conditions, and
default-off plan before any Brev lifecycle or remote command runs.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GI approval evidence:
   - [`docs/validation/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-v1.json`](../validation/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-v1.json)
   - [`docs/session-logs/630-mission-3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval.md`](../session-logs/630-mission-3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval.md)
   - [`docs/session-logs/631-observer-stop-m3gi-human-output-regeneration-approval.md`](../session-logs/631-observer-stop-m3gi-human-output-regeneration-approval.md)
5. M3GH evaluator sidecar repair evidence:
   - [`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`](../validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json)
   - [`docs/session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md`](../session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md)
   - [`docs/session-logs/628-mission-3gh-negative-challenge-tensor-path-repair.md`](../session-logs/628-mission-3gh-negative-challenge-tensor-path-repair.md)
6. M3GG/M3GF/M3GE/M3GD/M3GC/M3GB receipts and session logs listed by M3GI.
7. Local sidecar consumers and evaluator:
   - `scripts/analyze_rawframe_lesson_open_set.mjs`
   - `scripts/analyze_controlled_pilot_thresholds.mjs`
   - `scripts/evaluate_rawframe_model.py`
8. Copied-back ignored M3GB output files:
   - `output/m3gb-high-signal-region-grid-tcn-brev/model_state.pt`
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`
9. High-signal region-grid manifests:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
10. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-remote/no-training M3GJ slice.

1. Verify baseline state:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool web/public/model/claim-matrix.json >/dev/null
python3 -m json.tool docs/validation/final-claim-matrix.json >/dev/null
brev ls --json
git diff --check
```

`brev ls --json` is read-only. Do not start, exec, sync, copy, stop, create,
delete, or reset a Brev worker in M3GJ.

2. Patch the local sidecar consumers:

- `scripts/analyze_rawframe_lesson_open_set.mjs`
- `scripts/analyze_controlled_pilot_thresholds.mjs`

Both scripts should accept:

- `asl-pilot-rawframe-prediction-sidecar/v1`
- `asl-pilot-rawframe-prediction-sidecar/v2`

Keep the accepted field contract conservative. The existing v1 fields these
scripts consume must still be required. For v2, do not silently treat missing
core arrays or labels as acceptable. Prefer small shared helpers inside each
script or a tiny local helper only if it matches existing style; do not add a
new dependency.

3. Validate sidecar consumer compatibility without using model outputs as new
claim evidence:

- Run each script against an existing v1 sidecar if the default inputs or
  M3GB-copied sidecar make that practical.
- Add a small static fixture or temporary local check for v2 acceptance if
  needed. The fixture must not be mistaken for model evidence.
- Record which checks prove v1 compatibility and which prove v2 schema
  acceptance.

4. Run exactly one local evaluator regeneration command authorized by M3GI:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3gb-high-signal-region-grid-tcn-brev/model_state.pt --training-provenance output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json --calibrated-provenance output/m3gb-high-signal-region-grid-tcn-brev/calibrated-provenance.json --prediction-sidecar output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json --batch-size 8 --num-workers 0 --region-grid-tcn-training-smoke
```

This command is expected to regenerate ignored local diagnostic outputs. It may
exit nonzero if the diagnostic checkpoint still fails gates. That is not a
reason to retry, patch the model, or switch to Brev inside M3GJ. Record the
exit status, stdout/stderr summary, and output hashes before and after.

Do not add `--challenge-manifest`; M3GI intentionally preserved the original
M3GB input evidence scope.

5. Validate regenerated outputs if they exist:

```sh
python3 -m json.tool output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json >/dev/null
python3 -m json.tool output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json >/dev/null
```

Record whether `prediction-sidecar.json` now has:

- `schema_version: "asl-pilot-rawframe-prediction-sidecar/v2"`
- `sidecar_contract.version: "asl-pilot-rawframe-prediction-sidecar-contract/v2"`
- `probability_by_label`
- `true_label_probability`
- manifest path/hash/row index fields
- tensor path/hash fields

6. Write the tracked receipt:

`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`

The receipt must include:

- current commit and active prompt;
- user approval summary for continuing beyond M3GI;
- commands run and exit statuses;
- read-only Brev default-off state;
- files changed;
- consumer compatibility patch summary and checks;
- pre/post hashes for copied-back ignored M3GB outputs;
- evaluator regeneration command/status and any nonzero reason;
- regenerated sidecar/report schema and contract status;
- current metrics summary if a regenerated report exists;
- fail-closed claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- exactly one next action.

7. Write the numbered session log:

`docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md`

8. Select exactly one next action:

- `continue_m3gk_bounded_brev_completion_route_after_regenerated_evidence`
- `continue_m3gj_regeneration_or_consumer_fix_followup_no_brev`
- `continue_fail_closed_interactive_product_hardening`
- `continue_openai_or_gpt_pro_research_with_m3gb_evidence`
- `stop_for_human_budget_or_strategy_choice`

Choose the Brev route only if M3GJ leaves the repo with usable regenerated
diagnostic evidence or a clear compute-ready model/input hypothesis. If the
local evaluator/consumer work fails for a code-contract reason, choose the
local follow-up instead.

## Boundaries

- Local-only M3GJ work. No Brev lifecycle, remote command, training, fitting,
  sync, copy, package install, duplicate worker, worker delete/reset, or GPU
  spend.
- No second training attempt, broad 75/80/95-label run, label expansion,
  architecture search, hyperparameter sweep, Detector 0 training, source/media
  import, source-register mutation, manifest/tensor/vocabulary mutation,
  raw-video inspection/upload, crop thumbnail generation, generated labels,
  pseudo-labels, or dependency mutation.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model-card promotion, ONNX export, browser recognition activation,
  threshold promotion, final-readiness claim, positive ASL-correctness claim,
  product-runtime mutation, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GJ.
2. Required baseline checks pass or exact blockers are recorded.
3. The sidecar consumers accept v1 and v2 schema versions with conservative
   required-field checks.
4. The M3GI-approved local evaluator command has run exactly once or the exact
   blocker preventing it is recorded.
5. Regenerated outputs are JSON-valid if they exist, and their pre/post hashes
   are recorded.
6. The receipt records sidecar v2 contract status, consumer compatibility
   status, metrics if available, fail-closed claim status, forbidden-action
   proof, changed files, and exactly one next action.
7. Brev remains stopped/default-off and no remote command occurs.
8. Claim surfaces remain fail-closed.
9. A numbered session log exists.

## Observer Guidance

- CONTINUE if M3GJ completes the local consumer compatibility and evaluator
  regeneration slice, preserves fail-closed claims, records no forbidden
  action, and selects one allowed next action.
- NUDGE if it misses v1/v2 consumer checks, pre/post output hashes,
  regenerated sidecar contract status, evaluator exit details, claim-surface
  proof, Brev default-off proof, changed-file accounting, or exactly one next
  action.
- REDIRECT if it tries to run Brev, training, broad labels, Detector 0
  training, source import, export, promotion, browser activation, or claim
  expansion inside M3GJ.
- ESCALATE if the next proposed action changes architecture, input
  representation, source policy, budget, privacy posture, or claim policy
  without a current strategy/evidence memo.
- STOP only if a human budget/strategy decision is required before any useful
  local, product, or bounded Brev action remains.
