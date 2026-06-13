# Rawframe First Training Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this 95-label first-training prompt unless the user explicitly
approves a redirect away from the return-to-form milestone ladder.

Mission 3 of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first for the operating contract; this file scopes the first Brev-backed rawframe training milestone.

## Mission

Run the first promoted rawframe training round from **approved-external-source manifests** (PopSign v1 raw videos per [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json) decision `approved_popsign_v1_original_videos_2026_05_20`, which is `allowed_for_model_training: true` with `license_review_status: approved_cc_by_4_raw_video_with_attribution`). The mission: refresh local evidence, verify the existing 95-label manifests at `data/manifests/{train,validation,test,negative-challenge}.json`, launch the full training run on Brev through the mission-2 helper scripts, calibrate thresholds locally, export the trained ONNX browser artifact, and promote the model card only through the existing promotion script.

**Active recognition module = 95 PopSign-v1 labels.** The promoted lane recognizes the 95-label PopSign vocabulary. The 100-item [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts) is the content vocabulary surface; the 5 classroom-category additions (`help`, `stop`, `finish`, `school`, `plus`) are `learn_only_labels` and not training targets. The 95-label promotion satisfies the 75-100 label promotion gate. See [`GOAL.md`](../../GOAL.md) `current mission` for the active-vs-content split rationale.

This mission may run small local smoke checks, but its promoted exit is not a smoke claim. 10-sign or 20-sign runs are allowed only as non-promoted sanity checks unless `GOAL.md` is explicitly redirected.

**The first-party-browser-consent-capture lane** (also `allowed_for_model_training: true` in the source register) remains a valid future training-data source. It is NOT a blocker for this mission. Switching the active recognition module to first-party data is a deliberate future redirect, not a precondition.

## Source Of Truth

Order these by authority:

1. The user's latest explicit instructions in the active thread.
2. [`GOAL.md`](../../GOAL.md) operating contract, current mission, hard requirements, and commit cadence.
3. [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json) — **the authoritative rights chain**. Cross-reference any "blocked on X data" claim against this file BEFORE acting. Per session log [`041`](../session-logs/041-postmortem-first-party-misread.md), the prior 25-commit detour happened because the loop inherited a "first-party-only" paraphrase without re-deriving from this file.
4. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially `#arch-no-pretrained`, `#arch-first-party-data` (**read the FULL anchor text — the "unless explicit rights review clears the exact use" clause is load-bearing**), `#arch-storage-policy`, `#arch-training-pipeline`, `#arch-gpu-execution`, `#arch-passfail-thresholds`, `#arch-browser-export`, `#arch-active-module`.
5. [`DECISIONS.md`](../../DECISIONS.md), especially strict no-pretrained lane, Brev for heavy GPU, and no parallel audit system. **Active-vs-content vocabulary split** is the named pattern this mission formalizes.
6. [`docs/runbooks/first-party-collection.md`](../runbooks/first-party-collection.md) — relevant for the **future** first-party-data lane; not blocking for this mission.
7. [`MVP_TASKS.md`](../../MVP_TASKS.md): task-010, task-011, task-012, task-013, task-022, plus carry-forward from task-005/task-006/task-007.
8. Current pipeline stages in [`scripts/audit_final_rawframe_pipeline_preflight.mjs`](../../scripts/audit_final_rawframe_pipeline_preflight.mjs).
9. Existing training/evaluation/export/promotion scripts:
   - [`scripts/audit_local_ml_environment.py`](../../scripts/audit_local_ml_environment.py)
   - [`scripts/audit_final_manifests.py`](../../scripts/audit_final_manifests.py)
   - [`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/export_onnx_model.py`](../../scripts/export_onnx_model.py)
   - [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs)
   - [`scripts/run_final_browser_onnx_smoke.mjs`](../../scripts/run_final_browser_onnx_smoke.mjs)
   - [`scripts/promote_source_curated_vocabulary.mjs`](../../scripts/promote_source_curated_vocabulary.mjs) — used to produce the 95-item snapshot evidence the manifests bind to.
   - [`scripts/audit_loop_premise.mjs`](../../scripts/audit_loop_premise.mjs) — **run before every slice**; exit 1 means the loop premise is contradicted and no further slice should be sequenced on top of it.
10. Retained validation artifacts under [`docs/validation/`](../validation/) and model artifacts under `artifacts/rawframe-model/`.

## Current Known State

Mission 2 closed at `d5cc85f`, with the loop-exit log at [`docs/session-logs/007-loop-exit-exit-condition-met.md`](../session-logs/007-loop-exit-exit-condition-met.md). Then 25 commits of M3a–M3t interim work happened on a misread premise (postmortem at [`docs/session-logs/041-postmortem-first-party-misread.md`](../session-logs/041-postmortem-first-party-misread.md)); the safeguards landed as M4a/M4b/M4c at commits `a98f9d8` / `f412d4a` / `77482b0`; M4d (the framing-correction commit that also wrote this revised prompt) followed.

The repo state at the start of this **resumed** mission:

- Brev scripts and storage guardrail from task-006.
- First-party collection smoke and audit from task-007 (the future first-party lane; not blocking).
- 95-label PopSign-v1 manifests at `data/manifests/{train,validation,test,negative-challenge}.json` with `source_register.decision_id = approved_popsign_v1_original_videos_2026_05_20` (cleared for training per source register).
- `docs/model/active-vocabulary-claim.json` and `configs/active-sign-modules.example.json` with `modelVersion = "rawframe-not-trained"`.
- 100-item `web/src/lib/vocabulary.ts` (95 PopSign + 5 classroom). The 5 classroom items are `learn_only_labels`.
- `SignHintMetadata` populated for 19 signs and passing the hint pedagogy audit.
- `audit_final_manifests.py` first-failure blocker: manifests embed `vocabulary_review.evidence.sha256 = 16e207fb…` (95-item snapshot), but current `docs/review/final-vocabulary-review.json` is `c41e31a6…` (100-item). **The first reviewable slice resolves this by re-promoting a 95-item snapshot of the source-curated evidence so the manifests' hash binding is once again the current authoritative 95-item hash.**

The observer diagnostic preflight on 2026-05-24 reported other pre-mission-3 blockers: local ML receipt stale; retained model/export artifacts not final; model card still `not_trained`. Treat these as the starting state, not regressions.

## Intended Outcome

The repository has a promoted rawframe model trained on the 95-label PopSign-v1 active recognition module (from `popsign-v1-original-videos`, cleared for training per the source register), with signer-disjoint train/validation/test evidence, calibrated fail-closed thresholds, negative-challenge reject evidence, ONNX browser export, model-card promotion, active-vocabulary claim update, and retained browser smoke evidence. Claims remain narrow, truthful, and backed by current hashes. The 5 classroom-category content-vocabulary items (`help`, `stop`, `finish`, `school`, `plus`) are explicitly marked `learn_only_labels` in any UI claim surface; no claim of CV support for those 5 is made.

## Acceptance Criteria

All must be true before this mission closes:

1. **Preflight and collection readiness are current.**
   - `bash scripts/storage_budget_check.sh` passes.
   - `./.venv/bin/python scripts/audit_local_ml_environment.py --write-report docs/validation/local-ml-environment.json --report docs/validation/local-ml-environment.json` refreshes and then passes.
   - Collection plan/session bundle is current for the accepted vocabulary evidence, or the session log records that the human has not collected first-party clips yet and the loop returns to awaiting-observer without training.

2. **95-label active-recognition-module manifests are audit-clean.**
   - Train/validation/test and negative-challenge manifests exist at `data/manifests/train.json`, `data/manifests/validation.json`, `data/manifests/test.json`, and `data/manifests/negative-challenge.json` (they already do, bound to `popsign-v1-original-videos` per the source-register decision `approved_popsign_v1_original_videos_2026_05_20`).
   - They pass `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json` after the 95-item vocabulary-evidence snapshot lands (the first reviewable slice of this mission).
   - They preserve signer-disjoint splits, current vocabulary-review evidence for the 95-label active recognition module, source-register evidence, and required negative-challenge coverage.

3. **Raw RGB tensors are replayable and final training runs on Brev.**
   - `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/train.json --manifest data/manifests/validation.json --manifest data/manifests/test.json --manifest data/manifests/negative-challenge.json --tensor-root data/tensors --verify-only` passes before training.
   - Brev launch/sync/stop scripts are used by the human/operator for the heavy training run; **the autonomous loop must not provision Brev by itself.** When the orchestrator reaches the Brev-launch slice, it writes a session log naming the human-action precondition and enters the `awaiting observer` wake state with reason `harness-budget` (or, if a more specific reason is added later, `awaiting-human-brev-launch`).
   - Training writes `artifacts/rawframe-model/model_state.pt` and `artifacts/rawframe-model/training-provenance.json` from random initialization with `pretrained_components: []`.

4. **Evaluation calibrates a fail-closed threshold.**
   - `./.venv/bin/python scripts/evaluate_rawframe_model.py` runs against the final checkpoint, final manifests, and negative-challenge manifest.
   - It writes `artifacts/rawframe-model/validation-report.json` and `artifacts/rawframe-model/calibrated-provenance.json`.
   - The report status is a passing final candidate, includes signer-disjoint validation/test metrics, includes negative-challenge false-pass evidence, and records a threshold between 0 and 1.

5. **Browser artifact and claim promotion pass the existing audit chain.**
   - `./.venv/bin/python scripts/export_onnx_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/calibrated-provenance.json --output web/public/model/asl-pilot-rawframe-v0.onnx` writes current ONNX and export provenance.
   - `node scripts/promote_trained_model_card.mjs --dry-run` passes, then `node scripts/promote_trained_model_card.mjs` promotes the model card. Do not hand-edit `web/public/model/model-card.json`.
   - `node scripts/run_final_browser_onnx_smoke.mjs --write --write-on-pass-only` and `node scripts/audit_final_browser_onnx_smoke.mjs` pass against the promoted artifact.
   - `node scripts/audit_final_rawframe_pipeline_preflight.mjs` passes without diagnostic skip flags, or any remaining blockers are explicitly outside this mission and recorded in the close log.
   - `node scripts/audit_no_pretrained_deps.mjs`, `node scripts/audit_no_pretrained_artifact_json.mjs`, `node scripts/audit_model_artifacts.mjs`, and `node scripts/audit_downstream_vocabulary_provenance.mjs` pass.

## Evidence Standard

Before claiming completion, surface:

- current `git status --short` and changed-file summary;
- exact manifest paths, label counts, clip counts, signer split counts, dataset source mode, and SHA-256 hashes;
- local ML report hash, requirements hash, and `web/package-lock.json` hash;
- Brev instance name, GPU type, start/stop timestamps, training command, and copied artifact hashes;
- training provenance path/hash and random-initialization evidence;
- validation report path/hash, selected threshold, accepted accuracy, test metrics, and negative-challenge false-pass rate;
- ONNX artifact path/hash, export provenance path/hash, browser smoke artifact path/hash;
- model-card promotion dry-run output and promoted model-card hash;
- audit commands run with pass/fail status;
- unresolved blockers with the exact command or file proving each one.

Do not treat old external-dataset manifests, smoke artifacts, `--allow-small-label-set`, `--allow-smoke-eval`, `--allow-smoke-export`, or a `not_trained` model card as promoted evidence.

## Decision Status

Confirmed requirements:

- The promoted lane stays raw-frame/from-scratch only: no MediaPipe, OpenPose, YOLO, landmarks, pretrained detectors, pretrained backbones, model-zoo weights, `from_pretrained`, `torch.hub`, or pretrained `weights=` loads.
- Heavy final training runs on Brev. Local Mac Studio MPS is for smoke, evaluation, export, browser checks, and audits.
- **The training-data policy for this mission is the approved external source `popsign-v1-original-videos`** per [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json) (decision `approved_popsign_v1_original_videos_2026_05_20`, `allowed_for_model_training: true`, `license_review_status: approved_cc_by_4_raw_video_with_attribution`). First-party-browser-consent-capture is a valid future training-data source that this mission does NOT depend on.
- The model card and active-vocabulary claim are promoted only through existing scripts/audits.
- Current promotion/audit code requires a 75-100 label trained model for final promotion. The 95-label PopSign active recognition module satisfies this gate.

Assumptions:

- The existing 95-label PopSign manifests need a re-pinned 95-item vocabulary-evidence snapshot before `audit_final_manifests.py` will pass; this is the first reviewable slice.
- The first full Brev training run uses current default rawframe architecture and hyperparameters unless preflight evidence points to a narrower change.
- The orchestrator does NOT launch Brev itself; the Brev slice transitions to `awaiting observer` so a human can launch.

Recommended defaults:

- Start with `node scripts/audit_loop_premise.mjs` (must exit 0 before any slice runs), then `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay` as a cheap diagnostic, then follow its `next_stage` command.
- Use local smoke/dry-run commands to validate inputs before launching Brev.
- Keep all generated raw clips, tensors, stores, and Brev artifacts out of git unless an existing tracked validation artifact explicitly requires a summary.
- Stop Brev immediately after copying back artifacts.

Open questions:

- Whether a future mission should switch the active recognition module to first-party-browser-consent-capture once collection runs; this is a deliberate redirect for later, not a precondition for this mission.

## Execution Rhythm

1. Inspect `GOAL.md`, this prompt, `MVP_TASKS.md`, latest session log, observer log, and `git status`. **Then run `node scripts/audit_loop_premise.mjs` — must exit 0.**
2. Run the cheapest preflight command and read its `next_stage`.
3. If `audit_final_manifests.py` reports the 95-item-vs-100-item vocabulary-evidence SHA mismatch, the first slice is to re-promote a 95-item snapshot of the source-curated evidence so the manifests' embedded hash is once again authoritative. **Do not modify the manifests to point at the 100-item evidence** — the manifests are the recognition-module surface and stay 95-label.
4. Validate manifests and tensor provenance locally.
5. Run local smoke/dry-run checks, then **enter `awaiting observer` wake state** so a human can launch/sync the Brev worker for the heavy training run.
6. Copy back artifacts, stop Brev, evaluate/calibrate/export/promote locally.
7. Run no-pretrained, model-artifact, downstream provenance, browser smoke, and final rawframe preflight audits.
8. Commit each completed slice with the required heredoc template, update `MVP_TASKS.md`, and append a session log.
9. Close the mission only when all acceptance criteria are met, then invoke `/goal-update` for the next milestone.

## Progress Ledger

Use this compact format at the bottom of each session log:

```text
Current state:
Completed:
Evidence:
Remaining:
Blockers:
Next step:
Checkpoint commit:
```
