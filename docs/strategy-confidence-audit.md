# strategy-confidence-audit

**Round-001 task-026 vestige removal note (2026-05-23).**

The pre-round-001 version of this doc enumerated 95+ hard gates, many of
which were specific to the Stage A / MediaPipe disclosed-assisted lane
(extractor disclosure boundary, Stage A teacher frontier promotion gate,
Stage B supervision export gate, primarymath-keypoint research-lane gates,
ROI review chain, etc.). After [`task-026`](../MVP_TASKS.md#task-026)
removed the Stage A vestige, those gate rows reference deleted code,
artifacts, and reports.

Rather than carry stale Stage A-specific rows forward through more rounds
of cleanup, this doc has been reset to the minimal set of lane-agnostic
gates that survive after vestige removal. The pre-round-001 gate list
remains recoverable from git history (see commit `b81efc5` and earlier).

## current lane-agnostic hard gates

These gates apply to the promoted rawframe lane and are NOT Stage A
specific:

1. **No pretrained CV / sign / landmark / model dependencies in the
   promoted lane** ([`#arch-no-pretrained`](../ARCHITECTURE.md#arch-no-pretrained)).
   Verified by [`scripts/audit_no_pretrained_deps.mjs`](../scripts/audit_no_pretrained_deps.mjs)
   and [`scripts/audit_no_pretrained_artifact_json.mjs`](../scripts/audit_no_pretrained_artifact_json.mjs).
   Receipt: [`docs/validation/no-pretrained-lane-audit.json`](validation/no-pretrained-lane-audit.json)
   (produced by task-026 §H).

2. **No raw learner video upload during normal practice**
   ([`#arch-camera-privacy`](../ARCHITECTURE.md#arch-camera-privacy)).
   Verified by [`scripts/audit_no_raw_video_upload.mjs`](../scripts/audit_no_raw_video_upload.mjs)
   and [`scripts/audit_final_privacy_smoke.mjs`](../scripts/audit_final_privacy_smoke.mjs).

3. **First-party or cleared training data only.**
   Verified by [`scripts/audit_collection_plan_contract.mjs`](../scripts/audit_collection_plan_contract.mjs),
   [`scripts/audit_dataset_collection_readiness.mjs`](../scripts/audit_dataset_collection_readiness.mjs),
   and the Ed25519 reviewer-authority chain.

4. **Trained model card is hash-pinned and promoted via
   [`scripts/promote_trained_model_card.mjs`](../scripts/promote_trained_model_card.mjs).**
   Hand-edits to a trained model card are forbidden. (The current
   `not_trained` placeholder card was hand-reduced in task-026 §C to
   remove Stage A vestige; that is allowed because there is no trained
   hash chain to preserve.)

5. **Heavy GPU training goes to Brev; light smoke/eval/audit stays on
   local MPS** ([`#arch-gpu-execution`](../ARCHITECTURE.md#arch-gpu-execution)).

6. **Browser ONNX semantic parity fixture passes between PyTorch export
   and ONNX Runtime Web inference** when a trained card is promoted.
   Verified by [`scripts/run_browser_onnx_wiring_smoke.mjs`](../scripts/run_browser_onnx_wiring_smoke.mjs)
   + [`scripts/audit_browser_onnx_wiring_smoke.mjs`](../scripts/audit_browser_onnx_wiring_smoke.mjs).

7. **Practice progress smoke proves attempts persist and the fail-closed
   server contract holds.** Verified by
   [`scripts/run_practice_progress_smoke.mjs --write`](../scripts/run_practice_progress_smoke.mjs)
   + [`scripts/audit_practice_progress_smoke.mjs`](../scripts/audit_practice_progress_smoke.mjs).

8. **Final claim matrix records the honest state at the reviewer
   surface.** Verified by [`scripts/audit_final_claim_matrix.mjs`](../scripts/audit_final_claim_matrix.mjs)
   producing matching docs and public matrices, with
   `active_cv_claim === null` until a trained model card is promoted.

## reference

- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — locked architecture anchors.
- [`DECISIONS.md`](../DECISIONS.md) — locked / proposed / open / deferred / research-required.
- [`MVP_TASKS.md`](../MVP_TASKS.md) — annotated task graph.
- [`docs/briefs/001-stage-a-vestige-removal.md`](briefs/001-stage-a-vestige-removal.md) — the task-026 brief that landed this reset.
