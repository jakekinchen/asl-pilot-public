# Return-To-Form M3FW Tiny2/Tiny3 Architecture Objective Sanity Goal Loop Prompt

Mission 3FW prompt for the Codex executor after M3FV converted the M3FU
strategy stop into a concrete Tiny2/Tiny3 architecture/objective sanity
contract.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Implement the M3FV architecture/objective sanity contract as one local/no-spend
proof or record the exact blocker that prevents implementation. The proof must
distinguish real Tiny2 held-out signal from class-collapse false progress before
any broader recognizer, crop, source, or compute decision.

This mission may create or repair one scoped local runner and, after dry-run/
check-files gates pass, run at most one local Tiny2 `table`/`hello`
architecture/objective sanity proof. Tiny3 `black` is only a documented
extension gate after Tiny2 passes; it is not permission to expand into Fresh5,
25-label, 75-label, or 95-label work in this slice. No Brev lifecycle, remote
command, export, promotion, browser activation, source/media import, manifest/
tensor/vocabulary mutation, product claim expansion, or push is authorized.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the original fixed-crop/four-CNN/TCN spine, mutable overlay, and M3FV result.
4. M3FV contract and evidence:
   - [`docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json`](return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json)
   - [`docs/validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json`](../validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json)
   - [`docs/session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md`](../session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md)
5. Prior Tiny2/Tiny3 and ASL Citizen evidence:
   - [`docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json`](../validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json)
   - [`docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json`](../validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json)
   - [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json)
   - [`docs/validation/return-to-form-m3ey-asl-citizen-25-label-lesson-model-brev-v1.json`](../validation/return-to-form-m3ey-asl-citizen-25-label-lesson-model-brev-v1.json)
6. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
7. Training/evaluation/tensor scripts under [`scripts/`](../../scripts/).

## Required Slice

Complete one local/no-spend architecture/objective sanity slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Validate the M3FV contract and choose exactly one scratch/local architecture
   family before execution. Record why it is the smallest falsifiable test.
   Do not compare multiple architectures or objectives in this slice.

3. Create or repair one scoped runner, expected at:

`scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py`

The runner must bind to the M3FV contract, ASL Citizen high-signal region-grid
manifests, `rgb_regions_grid_v1`, Tiny2 labels `table`/`hello`, frame count
`16`, image size `96`, and `num_workers=0`. It must support a dry-run/
check-files gate before any fitting.

4. Run the dry-run/check-files gate. If it fails, stop after recording the
exact blocker. If it passes, run at most one local Tiny2 proof. The proof must
report train accuracy, validation top-1, validation macro-F1, per-label recall,
predicted-label distribution, dominant-class share, and a label-shuffle or
equivalent false-progress control when feasible. If all held-out predictions
collapse to one label, classify the proof as failed even when train accuracy
passes.

5. Select exactly one next action:

- `continue_tiny3_extension_no_spend`
- `continue_architecture_objective_blocker_triage_no_spend`
- `continue_crop_or_input_schema_review_no_spend`
- `prepare_bounded_composable_brev_microexperiment_receipt_for_human_approval`
- `stop_for_human_ml_strategy_choice`

Do not select Brev or broader training unless the receipt prepares only a
future compute proposal and explicitly marks it as requiring human approval
before any lifecycle or training command.

## Receipt

Write:

`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3FV contract path and validation status;
- runner path and whether it was created, repaired, or blocked;
- chosen architecture/objective and why it is the smallest falsifiable test;
- data/source/label/input scope;
- dry-run/check-files result;
- Tiny2 train and held-out metrics if the proof ran, or exact blocker if not;
- class-collapse and false-progress controls;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

## Session Log

Write:

`docs/session-logs/603-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md`

The session log must record commands, evidence inspected, contract validation,
runner status, dry-run result, proof result or blocker, Brev default-off status,
claim surfaces, changed files, and exactly one next action.

## Boundaries

- Local/no-spend only.
- At most one bounded local Tiny2 proof after dry-run/check-files gates pass.
- No Tiny3 run unless Tiny2 passes and the active receipt records the next
  action as `continue_tiny3_extension_no_spend`; do not execute Tiny3 in this
  same slice.
- No Fresh5, 25-label, 75-label, 95-label, broad recognizer, architecture
  sweep, objective sweep, Detector 0 smoke rerun, completed checkpoint
  evaluation outside this runner, threshold tuning for promotion, export,
  model-card promotion, active-vocabulary promotion, browser recognition
  activation, product-runtime recognition mutation, runtime Detector 0
  authority, final-readiness claim, trainability claim, or positive ASL
  correctness claim.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No source-register edit, source/media import, manifest/tensor/packet/
  vocabulary mutation, raw learner video/frame upload, push, amend,
  destructive reset, or no-verify commit.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FW.
2. Required local checks pass or record exact blockers.
3. The M3FV contract is validated and the selected architecture/objective is
   recorded before execution.
4. The scoped M3FW runner exists or the exact blocker preventing it is recorded.
5. The dry-run/check-files gate passes before any proof, or the exact blocker is
   recorded.
6. At most one local Tiny2 proof runs, and the receipt records train sanity,
   held-out metrics, class-collapse controls, and false-progress controls, or
   records the exact blocker that prevented the proof.
7. Claim surfaces remain fail-closed.
8. No forbidden Brev, source, broad model, export, promotion, browser
   activation, runtime Detector 0 authority, or unsupported claim work occurs.
9. A tracked receipt and numbered session log exist and select exactly one next
   action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend, preserves fail-closed
  claims, produces the scoped runner/receipt/log or records an exact blocker,
  and selects one allowed next action.
- NUDGE if it misses contract validation, runner accounting, dry-run proof,
  collapse controls, forbidden-action proof, changed-file accounting, or exactly
  one next action.
- REDIRECT if it drifts into broad recognizer training, Brev lifecycle/spend,
  source import, data mutation, export, promotion, browser activation, or claim
  expansion.
- ESCALATE if the local proof result is ambiguous enough that the next model
  move would change architecture, input representation, or compute budget
  without a current strategy memo covering the exact decision.
- STOP if the next meaningful step requires human source, compute, privacy,
  claim, or final-submission approval.
