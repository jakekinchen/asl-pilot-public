# execution-plan

**Round-001 task-026 vestige removal note (2026-05-23).**

The pre-round-001 version of this doc described a two-stage execution
plan: Stage A (browser-local MediaPipe-extractor + DTW template verifier
as immediate delivery path) and Stage B (rawframe student trained on
saved Stage A signals). After [`task-026`](../MVP_TASKS.md#task-026)
removed the Stage A vestige, the two-stage narrative no longer applies.

The current execution plan is single-lane: the rawframe browser model
(random init, raw RGB only) is the only promoted path. It is currently
`not_trained` pending first-party data collection and Brev training.

## current execution plan

The authoritative task graph is in [`MVP_TASKS.md`](../MVP_TASKS.md).
The current ready queue, in priority order:

1. **`task-005`** — declare the rawframe-lane active sign module against
   the trained card (after `task-011` produces signer-disjoint metrics).
2. **`task-006`** — author `scripts/storage_budget_check.sh` and the
   three `scripts/brev_*.sh` helpers for Brev provisioning and shutdown.
3. **`task-017`** — refactor `web/src/lib/client-model.ts` into a typed
   `InferenceEngine` + `PassFailDecision` module.
4. **`task-018`** — extend the vocabulary schema with phonological
   hint metadata (handshape, movement, location, orientation, timing,
   framing).
5. **`task-007`** — first-party consented clip collection (the gated
   path is scaffolded but disabled by default).
6. **`task-011`** — rawframe training on Brev once a first-party dataset
   exists; promotion via
   [`scripts/promote_trained_model_card.mjs`](../scripts/promote_trained_model_card.mjs).
7. **`task-022`** — refresh
   [`docs/validation/final-claim-matrix.json`](validation/final-claim-matrix.json)
   and produce the trained-card no-pretrained receipt once a trained
   card exists.

Pre-round-001 sequencing language (Stage A teacher frontier promotion,
Stage B supervision export, primarymath-keypoint research expansion,
ROI review chain) is no longer applicable and has been removed.

## reference

- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — `#arch-no-pretrained`,
  `#arch-downscope-ladder`, `#arch-gpu-execution`, `#arch-camera-privacy`.
- [`DECISIONS.md`](../DECISIONS.md) — the four round-001 locked decisions.
- [`docs/strategy-confidence-audit.md`](strategy-confidence-audit.md) —
  the surviving lane-agnostic hard gates.
- [`docs/briefs/001-stage-a-vestige-removal.md`](briefs/001-stage-a-vestige-removal.md) — the task-026 brief.
