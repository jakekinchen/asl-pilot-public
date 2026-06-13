# ASL Pilot Completion Goal

**Round-001 task-026 vestige removal note (2026-05-23).**

The pre-round-001 version of this doc described the pilot as a
two-stage strategy: Stage A (browser-local pretrained-assisted target
verifier using MediaPipe Hand Landmarker + DTW templates as the
immediate delivery path) and Stage B (rawframe student trained on Stage
A's saved signals). After [`task-026`](../../MVP_TASKS.md#task-026)
removed the Stage A vestige, that two-stage strategy is obsolete.

## current goal

Train, validate, and promote a single browser-local raw-RGB recognition
model — random initialization, no pretrained extractor, no upstream
keypoint inheritance, no MediaPipe runtime asset — that meets the
SuperBuilders partner project's pilot requirements at
[`superbuilders-partner-project-asl-learning-with-computer-vision.pdf`](../../superbuilders-partner-project-asl-learning-with-computer-vision.pdf).

The promoted lane is the **rawframe** browser model. It is currently
`not_trained`. The path to a trained pilot is:

1. Collect first-party consented browser-recorded clips against the
   reviewed collection plan (`task-007`).
2. Train the rawframe model on Brev with signer-disjoint train /
   validation / test splits (`task-011`).
3. Validate with held-out evidence; export to ONNX with semantic parity
   fixture (`task-013`); promote a trained model card via
   [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs)
   (`task-022`).
4. Re-run the browser ONNX wiring smoke (`task-013` re-run).
5. Re-run the practice progress smoke (`task-019` re-run).
6. Update the final claim matrix to expose an active CV claim.

Until step 3 lands, every prompt-catalog label is learn-only and every
attempt is server-side fail-closed.

## boundaries

- No pretrained CV / sign / landmark / model dependencies in the
  promoted lane ([`#arch-no-pretrained`](../../ARCHITECTURE.md#arch-no-pretrained)).
- No raw learner video upload during normal practice
  ([`#arch-camera-privacy`](../../ARCHITECTURE.md#arch-camera-privacy)).
- Heavy GPU training on Brev; light smoke / eval / audit on local
  Apple MPS ([`#arch-gpu-execution`](../../ARCHITECTURE.md#arch-gpu-execution)).
- First-party or cleared training data only
  ([`#arch-first-party-data`](../../ARCHITECTURE.md#arch-first-party-data)).
- Trained model card promotion via `promote_trained_model_card.mjs`;
  hand-edits to a trained card are forbidden.

## reference

- [`MVP_TASKS.md`](../../MVP_TASKS.md) — task graph.
- [`docs/execution-plan.md`](../execution-plan.md) — current single-lane
  execution plan.
- [`docs/strategy-confidence-audit.md`](../strategy-confidence-audit.md)
  — surviving lane-agnostic hard gates.
- [`docs/briefs/001-stage-a-vestige-removal.md`](../briefs/001-stage-a-vestige-removal.md) — the task-026 brief that landed this reset.
