# acceptance-checklist

**Round-001 task-026 vestige removal note (2026-05-23).**

The pre-round-001 acceptance checklist enumerated Stage A target-verifier
promotion criteria (75-label macro recall ≥ 0.7, hard-negative
false-accept rate ≤ 0.1, browser package SHA-256 binding, etc.). After
[`task-026`](../MVP_TASKS.md#task-026) removed the Stage A vestige,
those criteria are no longer applicable.

The current acceptance checklist is single-lane: the rawframe browser
model is the only path that can produce an active CV claim, and it is
currently `not_trained`.

## current acceptance criteria

A pilot deliverable is acceptable for review if **all** of the
following are true:

- [ ] [`scripts/audit_no_pretrained_deps.mjs`](../scripts/audit_no_pretrained_deps.mjs)
  passes.
- [ ] [`scripts/audit_no_pretrained_artifact_json.mjs`](../scripts/audit_no_pretrained_artifact_json.mjs)
  passes with no findings.
- [ ] [`docs/validation/no-pretrained-lane-audit.json`](validation/no-pretrained-lane-audit.json)
  exists and is hash-bound into
  [`docs/validation/final-claim-matrix.json`](validation/final-claim-matrix.json).
- [ ] `npm --prefix web run lint`, `typecheck`, and `build` all pass.
- [ ] [`scripts/audit_browser_onnx_wiring_smoke.mjs`](../scripts/audit_browser_onnx_wiring_smoke.mjs)
  passes after `run_browser_onnx_wiring_smoke.mjs --write`.
- [ ] [`scripts/run_practice_progress_smoke.mjs --write`](../scripts/run_practice_progress_smoke.mjs)
  and [`scripts/audit_practice_progress_smoke.mjs`](../scripts/audit_practice_progress_smoke.mjs)
  pass.
- [ ] [`scripts/audit_no_raw_video_upload.mjs`](../scripts/audit_no_raw_video_upload.mjs)
  and [`scripts/audit_final_privacy_smoke.mjs`](../scripts/audit_final_privacy_smoke.mjs)
  pass.
- [ ] [`scripts/audit_final_claim_matrix.mjs`](../scripts/audit_final_claim_matrix.mjs)
  passes with no blockers; docs and public claim matrices agree.
- [ ] [`scripts/audit_model_artifacts.mjs --require-trained`](../scripts/audit_model_artifacts.mjs)
  passes only after a trained model card is promoted via
  [`scripts/promote_trained_model_card.mjs`](../scripts/promote_trained_model_card.mjs).
  Until then, the `not_trained` placeholder card is acceptable as
  fail-closed scaffolding (verified by `audit_model_artifacts.mjs`
  without `--require-trained`).

## reference

- [`docs/strategy-confidence-audit.md`](strategy-confidence-audit.md) —
  surviving lane-agnostic hard gates and their detailed evidence chains.
- [`MVP_TASKS.md`](../MVP_TASKS.md) — annotated task graph.
- [`docs/briefs/001-stage-a-vestige-removal.md`](briefs/001-stage-a-vestige-removal.md) — the task-026 brief.
