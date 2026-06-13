# RESUME — ASL Pilot project handoff

**One-page tl;dr** for the next person picking up the project (returning human, ASL reviewer, successor agent). Read this first; everything else is referenced by path below.

## Where the project stands

A browser-first ASL 1 vocabulary practice pilot. The promoted lane is **rawframe-from-scratch only** (no pretrained CV/sign/landmark dependencies). The browser app works end-to-end through Practice + Camera + Save Attempt flows. Recognition is **fail-closed** because the model card is `not_trained` — every attempt persists with `passed: false` and a "model not trained yet" hint. 100 source-curated ASL 1 vocabulary items live in [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts) with structured hint metadata for 19 of them at [`web/src/lib/sign-hint-metadata.json`](../../web/src/lib/sign-hint-metadata.json).

The active loop is **Mission 3R — Codex rawframe training readiness recovery**. Current local pre-Brev checks are green in session logs [`128`](../session-logs/128-local-pre-brev-environment.md) through [`131`](../session-logs/131-brev-handoff-runbook.md). The current blocker is explicit human approval for a paid Brev run using the approved 95-label PopSign-v1 raw-video manifests. First-party collection is a future data lane, not the active Mission 3R blocker. Final promotion still waits on the negative-challenge coverage gap recorded in [`127-final-manifest-blocker-classification.md`](../session-logs/127-final-manifest-blocker-classification.md).

Use `bash scripts/preflight.sh` for the retained audit + smoke chain when you need a full local sanity check.

## What the autonomous loop built

The original Claude orchestrator + Codex observer loop closed **two real missions** and **eleven interim missions** in this round. The active loop has since moved to Codex executor + Codex observer; see [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md).

### Real missions

- **Mission 1 — Stage A vestige removal** (DTW/keypoint lane fully removed; no-pretrained audits clean). Session log [`002-stage-a-vestige-removal.md`](../session-logs/002-stage-a-vestige-removal.md).
- **Mission 2 — Rawframe trainability** (Brev scripts + storage guardrail + first-party collection runtime smoke + `active-vocabulary-claim.json` + 12 structured hint entries + first-party collection runbook). Loop-exit summary at [`007-loop-exit-exit-condition-met.md`](../session-logs/007-loop-exit-exit-condition-met.md).

### Interim missions (mission 3 is paused; these are the work the loop produced while paused)

- **M3a** — Typed `InferenceEngine` + `PassFailDecision` modules + `SIGN_HINT_METADATA` integration. Session log [`012-mission-3a-task-017-close.md`](../session-logs/012-mission-3a-task-017-close.md).
- **M3b** — Playwright camera-behavior smoke refresh (5 layered UI/auth drifts fixed). [`014-mission-3b-task-016-close.md`](../session-logs/014-mission-3b-task-016-close.md).
- **M3c** — PracticeApp `PassFailDecisionOutput` UI migration (structured `reasons[]` + `hintDimension` badge visible to learner). [`016-mission-3c-practice-decision-ui-close.md`](../session-logs/016-mission-3c-practice-decision-ui-close.md).
- **M3d** — Observer-monitoring ergonomics: `scripts/watch_observer.sh` (live tail with auto-rotation) + observer-runbook "Monitoring the observer" section + rotation-hang fix with synthetic proof. [`019-mission-3d-observer-monitoring-close.md`](../session-logs/019-mission-3d-observer-monitoring-close.md) + [`020-mission-3d-rotation-fix.md`](../session-logs/020-mission-3d-rotation-fix.md).
- **M3e** — Active-vocabulary-claim API route + boot-time fetch in PracticeApp + `Content-only` badge per prompt. [`021-mission-3e-active-vocab-ui.md`](../session-logs/021-mission-3e-active-vocab-ui.md).
- **M3f** — `REASON_COPY` audit binding: 8 typed `PassFailReason` strings now gated by the same diagnostic-language regex as `coachingHint` + structured metadata. [`022-mission-3f-reason-copy-audit.md`](../session-logs/022-mission-3f-reason-copy-audit.md).
- **M3g** — 14 stale post-`task-027`-rewrite SHAs replaced across STAGE_GATE_STATUS / GOAL / two old session logs + commit-reference policy added to team-protocol. [`023-mission-3g-stale-sha-cleanup.md`](../session-logs/023-mission-3g-stale-sha-cleanup.md).
- **M3h** — Operator-facing [`vocabulary-reviewer-chain.md`](../runbooks/vocabulary-reviewer-chain.md) runbook (both add-vocab and external-Ed25519-review workflows). [`024-mission-3h-reviewer-chain-doc.md`](../session-logs/024-mission-3h-reviewer-chain-doc.md).
- **M3i** — Root `README.md` rewrite (401 → 110 lines; all stale Stage-A-era identifiers removed). [`025-mission-3i-readme-refresh.md`](../session-logs/025-mission-3i-readme-refresh.md).
- **M3j** — [`scripts/preflight.sh`](../../scripts/preflight.sh) single-command audit chain. [`027-mission-3j-preflight-helper.md`](../session-logs/027-mission-3j-preflight-helper.md).
- **M3k** — 5 more structured hint metadata entries (blue/green/yellow/red/black); total 12 → 17. [`028-mission-3k-color-hints.md`](../session-logs/028-mission-3k-color-hints.md).
- **M3l** — This handoff doc.
- **M3R recovery** — Codex takeover and PopSign/Brev readiness recovery; see [`126-codex-loop-takeover.md`](../session-logs/126-codex-loop-takeover.md) through [`133-mvp-tasks-popsign-blocker-alignment.md`](../session-logs/133-mvp-tasks-popsign-blocker-alignment.md).

## Human-action gates

### Gate 1 — Brev approval for PopSign-v1 training (current)

The local pre-Brev path is prepared, but the paid worker must be approved by the human in the current session. Do not let an autonomous agent provision Brev. The operator handoff is exact:

```sh
cat docs/runbooks/brev-rawframe-training-handoff.md
```

That runbook names the A100 default, sync paths, remote train command, expected artifacts, copy-back step, and stop command. No final gate changes are needed for this first training-readiness pass.

### Gate 2 — First-party clip collection (future data lane)

First-party collection remains useful if the project later switches from the approved PopSign-v1 source to signer-collected data. The runbook is exact; a printable one-pager checklist for the recording-session day is at [`docs/handoff/CHECKLIST.md`](CHECKLIST.md).

```sh
cat docs/runbooks/first-party-collection.md   # read first
bash scripts/storage_budget_check.sh           # preflight
node scripts/audit_vocabulary_review.mjs       # source-curated gate
# then follow the runbook step-by-step
```

The runbook covers reviewer-authority chain, signer-identity registration, the `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true` build gotcha, in-app capture, in-flight audits, consent receipts, clip review, and approved-only manifest export. The smoke at [`docs/validation/dataset-collection-runtime-smoke.json`](../validation/dataset-collection-runtime-smoke.json) (status `passed`, `finality: smoke_only`) proves the runtime wiring works end-to-end against an isolated fixture.

### Gate 3 — External ASL reviewer (optional, stronger evidence)

The current vocabulary evidence is `source_curated_no_external_review` — the project explicitly does not claim Deaf-educator or ASL-instructor approval. To upgrade, follow workflow 2 of [`vocabulary-reviewer-chain.md`](../runbooks/vocabulary-reviewer-chain.md): Ed25519 pre-review key binding → reviewer signs the canonical packet → `node scripts/import_vocabulary_review.mjs --write`.

Gate 3 is optional for the pilot. Gate 1 is required before the first PopSign Brev training run.

## Resume the autonomous loop

1. Confirm [`GOAL.md`](../../GOAL.md) still points at [`docs/model/codex-rawframe-training-readiness-goal-loop-prompt.md`](../model/codex-rawframe-training-readiness-goal-loop-prompt.md).
2. If approving paid Brev work, follow [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md). Otherwise continue only with no-spend documentation/truth-alignment slices.
3. Re-enter the Codex loop:

```sh
bash scripts/start_codex_goal_loop.sh --role both
```

Use `bash scripts/start_codex_goal_loop.sh --role both --dry-run` first when changing accounts or profiles. The observer runbook remains [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md), and `bash scripts/watch_observer.sh` tails observer logs.

## Verify repo state at any point

```sh
bash scripts/preflight.sh           # full chain (~12 s)
bash scripts/preflight.sh --fast    # skip web build + ONNX wiring smoke (~5 s)
```

15 checks; fast-fails on first failure; appends a one-line record to `docs/validation/preflight-runs.log` (gitignored).

To run preflight automatically before every commit, opt in via the sample pre-commit hook:

```sh
cp scripts/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

(Or symlink so future updates propagate: `ln -sf ../../scripts/pre-commit.sample .git/hooks/pre-commit`.)

## Hard rules (never violate)

- No pretrained CV/sign/landmark/model dependencies in the promoted lane ([`#arch-no-pretrained`](../../ARCHITECTURE.md#arch-no-pretrained)).
- No raw learner video upload during normal practice ([`#arch-camera-privacy`](../../ARCHITECTURE.md#arch-camera-privacy)).
- Heavy GPU → Brev. Smoke/eval/export/audits → local Mac Studio MPS ([`#arch-gpu-execution`](../../ARCHITECTURE.md#arch-gpu-execution)).
- Do not hand-edit [`web/public/model/model-card.json`](../../web/public/model/model-card.json); use [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs).
- Never push to remote without explicit human approval.
- Never `--no-verify` or `--amend`.

## Where to look for deeper detail

| topic | file |
|---|---|
| Architecture invariants | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) |
| Task graph + repo state | [`MVP_TASKS.md`](../../MVP_TASKS.md) |
| Locked / open / deferred decisions | [`DECISIONS.md`](../../DECISIONS.md) |
| Stage-gate state | [`STAGE_GATE_STATUS.md`](../../STAGE_GATE_STATUS.md) |
| Autonomous loop protocol | [`docs/autonomous-orchestrator-protocol.md`](../autonomous-orchestrator-protocol.md) |
| Observer side (Codex) | [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md) |
| 95+ hard gates | [`docs/strategy-confidence-audit.md`](../strategy-confidence-audit.md) |
| Per-slice narrative | [`docs/session-logs/`](../session-logs/) |
