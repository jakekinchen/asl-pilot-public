# Rawframe Trainability Goal Loop Prompt

Mission 2 of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first for the operating contract; this file scopes the specific milestone work.

## Mission

Make the rawframe lane operationally trainable. Stand up every piece of infrastructure that must exist before a human can either (a) collect first-party clips and audit them, or (b) launch the first Brev training round — so that as soon as data is in hand, training is a one-command operation.

This mission does not itself train a model and does not require a human signer session. It produces the scripts, configs, runbook, and end-to-end smoke evidence that make those next steps low-friction.

## Source Of Truth

Order these by authority:

1. The user's latest explicit instructions in the active thread.
2. [`GOAL.md`](../../GOAL.md) operating contract + hard requirements.
3. [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — especially `#arch-gpu-execution`, `#arch-storage-policy`, `#arch-first-party-data`, `#arch-training-pipeline`, `#arch-no-pretrained`.
4. [`DECISIONS.md`](../../DECISIONS.md) — round-001 decisions (no pretrained, Brev for heavy GPU, harmonize with existing audit chain, autonomous workflow).
5. [`docs/strategy-confidence-audit.md`](../strategy-confidence-audit.md) — 95+ hard gates; especially "Local GPU/open-source environment drift", "Direct training entrypoint bypass", "From-scratch provenance overclaim", "Per-split signer coverage", "Complete label coverage", "First-party or cleared training data".
6. [`MVP_TASKS.md`](../../MVP_TASKS.md) — task-005, task-006, task-007, task-018 are the four sub-tracks.
7. Existing infrastructure to extend (do not duplicate):
   - [`scripts/audit_completion_readiness.mjs`](../../scripts/audit_completion_readiness.mjs)
   - [`scripts/audit_local_ml_environment.py`](../../scripts/audit_local_ml_environment.py)
   - [`scripts/audit_dataset_collection_readiness.mjs`](../../scripts/audit_dataset_collection_readiness.mjs)
   - [`scripts/run_dataset_collection_runtime_smoke.mjs`](../../scripts/run_dataset_collection_runtime_smoke.mjs)
   - [`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`docs/validation/local-ml-environment.json`](../validation/local-ml-environment.json)
   - [`docs/validation/no-pretrained-lane-audit.json`](../validation/no-pretrained-lane-audit.json) (produced by task-026)

## Intended Outcome

By the end of this mission, the repo contains:

1. **Brev launch/sync/stop scripts** that a human can run in 3 commands to bring up, sync the repo to, and tear down a Brev GPU worker — with no manual SSH, no manual rsync, no risk of leaving a worker billing overnight.
2. **Storage guardrail** that fails-closed before any large data pull or shard build if local free space < 250 GB or project data > 650 GB (per `#arch-storage-policy`).
3. **First-party collection chain dry-run** proving end-to-end that an operator can: enable the gates → load a reviewed collection plan → record consent → capture clips → review clips → export approved-only training/validation/test manifests — without any pretrained component touching the pipeline.
4. **Rawframe-lane active module declaration** at `docs/model/active-vocabulary-claim.json` + `configs/active-sign-modules.example.json` bound to the rawframe lane (currently empty/unbound; will be populated after first training round).
5. **Hint metadata schema** extending the vocabulary with handshape / movement / location / orientation / timing / framing fields, plus a reviewer-authority-passing example for ≥10 signs.
6. **Collection runbook** at `docs/runbooks/first-party-collection.md` — exact commands the human runs end-to-end for a one-signer first-party session, including all consent/identity/review steps.

The mission is **infrastructure**, not training. No model is trained as part of this mission.

## Exit Condition

All five must be true:

1. `bash scripts/storage_budget_check.sh` exits non-zero when project data > 650 GB or free space < 250 GB; exits zero otherwise. `bash -n` passes for all four Brev scripts (`brev_create_48h.sh`, `brev_sync_repo.sh`, `brev_stop_all_training.sh`, `storage_budget_check.sh`).
2. `node scripts/run_dataset_collection_runtime_smoke.mjs --write` passes against an isolated reviewed-vocabulary / collection-plan / store / clip-root fixture, and `node scripts/audit_dataset_collection_runtime_smoke.mjs` confirms the report is honest (clips remain `pending`, duplicate assignments rejected, coverage non-exportable, report excluded from final evidence).
3. `configs/active-sign-modules.example.json` and `docs/model/active-vocabulary-claim.json` exist; both reference `modelVersion = "rawframe-not-trained"` and an empty active label set; both pass an extended `node scripts/audit_downstream_vocabulary_provenance.mjs`.
4. Vocabulary schema is extended with `SignHintMetadata`; ≥10 signs have populated hint metadata passing `node scripts/audit_hint_pedagogy_review.mjs` (or the next-best audit if the script needs to be added to the chain).
5. `docs/runbooks/first-party-collection.md` exists and a smoke run of the runbook (against the fixture from #2) completes end-to-end with the exact commands documented in the runbook.

When all five are true, invoke `/goal-update` to queue mission 3: **First Brev training round** (`task-010` rawframe baseline smoke → `task-011` full training run → `task-012` thresholds → `task-013` re-export → `task-022` promote model card).

## Suggested Execution Order

Pick the smallest unfinished item from this list each iteration. Reorder freely if dependencies change. **Commit at every completed sub-track.**

1. **Brev scripts + storage guardrail** (`task-006`). Smallest deliverable; entirely shell scripts. Estimated 2–4 commits.
   - `scripts/storage_budget_check.sh` — read thresholds from [`configs/storage-budget.json`](../../configs/storage-budget.json) (seeded round 001); fail-closed.
   - `scripts/brev_create_48h.sh` — provision a Brev instance via `brev create` with the 48-hour tag and the rawframe training role.
   - `scripts/brev_sync_repo.sh` — rsync the repo to the Brev worker excluding `data/`, `node_modules/`, `.next/`, `artifacts/`, `.venv/`, `output/`.
   - `scripts/brev_stop_all_training.sh` — stop every Brev instance tagged with this project's tag; idempotent.
   - Add Brev script smoke-validation rows to `MVP_TASKS.md` task-006.

2. **Hint metadata schema** (`task-018`). Pure code/content work.
   - Extend `web/src/lib/vocabulary.ts` (or create a new `vocabulary_items` table per `task-015a`) with `SignHintMetadata` per [`#arch-vocab-hints`](../../ARCHITECTURE.md#arch-vocab-hints).
   - Seed from [`configs/sign-hints.example.json`](../../configs/sign-hints.example.json).
   - Wire to [`scripts/audit_hint_pedagogy_review.mjs`](../../scripts/audit_hint_pedagogy_review.mjs) (if missing, add it to the existing audit chain — do not introduce a parallel tool).
   - Populate hint metadata for ≥10 signs; verify via the reviewer-authority chain.

3. **Rawframe-lane active module declaration** (`task-005`). Doc/config.
   - Create `docs/model/active-vocabulary-claim.json` with `modelVersion = "rawframe-not-trained"`, `activeLabels = []`, `evidenceArtifacts = []`, plus a clear "no claim yet" disclaimer.
   - Update `configs/active-sign-modules.example.json` to point at the rawframe lane (drop any vestige references).
   - Extend [`scripts/audit_downstream_vocabulary_provenance.mjs`](../../scripts/audit_downstream_vocabulary_provenance.mjs) to require the new file's presence + schema.

4. **First-party collection dry-run** (`task-007`).
   - Build an isolated fixture: a tiny `reviewed-vocabulary-fixture.json`, a `collection-plan-fixture.json` for 3 signers × 5 labels × 1 clip each, an empty `store-fixture/`, an empty `clip-root-fixture/`.
   - Run [`scripts/run_dataset_collection_runtime_smoke.mjs`](../../scripts/run_dataset_collection_runtime_smoke.mjs) `--write` against the fixture.
   - Audit with [`scripts/audit_dataset_collection_runtime_smoke.mjs`](../../scripts/audit_dataset_collection_runtime_smoke.mjs).

5. **Runbook** (`docs/runbooks/first-party-collection.md`).
   - Exact commands from human enabling `ENABLE_DATASET_COLLECTION=true` env vars, through clip capture, through reviewer authority chain, through manifest export.
   - Cite the fixture run as smoke evidence.
   - Include the bail-out: "if any single signer can't be collected, log it and continue; do not block on incomplete signer roster."

## Tactics That Are Allowed

- Refactor `scripts/audit_*.mjs` chain to absorb new audits rather than adding a parallel system.
- Use existing reviewer-authority Ed25519 chain (`data/vocabulary-review/evidence/`); do not introduce a new identity scheme.
- Run all light work (script smokes, fixture audits, lint, build) on local Mac Studio MPS. Do not provision Brev for this mission.
- Author Playwright camera-state specs for `task-016` opportunistically if hint metadata work surfaces UI gaps (low priority; not in exit condition).

## Tactics That Are NOT Allowed

- Do not write any code that imports MediaPipe, OpenPose, YOLO, or any pretrained CV component anywhere — even for "test data generation".
- Do not provision a Brev instance from inside the autonomous loop. The scripts ready; the human invokes them.
- Do not run `scripts/train_rawframe_model.py` for real — only validate the `--smoke --no-write` path works.
- Do not collect real signer data inside the autonomous loop. The runbook exists for the human to run.
- Do not modify [`web/public/model/model-card.json`](../../web/public/model/model-card.json) — it stays `not_trained` until the model promotion script is run with real Brev training evidence.
- Do not commit large fixture data; fixtures stay tiny and inline.
- Do not push to remote.

## Validation Chain (run after every sub-track)

```sh
# infrastructure
bash scripts/storage_budget_check.sh
bash -n scripts/brev_create_48h.sh scripts/brev_sync_repo.sh scripts/brev_stop_all_training.sh

# collection chain
node scripts/audit_dataset_collection_readiness.mjs
node scripts/audit_collection_plan_contract.mjs
node scripts/audit_reviewed_vocabulary_collection_gate.mjs
node scripts/run_dataset_collection_runtime_smoke.mjs --write
node scripts/audit_dataset_collection_runtime_smoke.mjs

# active module + hints
node scripts/audit_downstream_vocabulary_provenance.mjs
node scripts/audit_hint_pedagogy_review.mjs

# web sanity (catches any vocabulary schema break)
npm --prefix web run lint
npm --prefix web run typecheck

# no-pretrained re-verification (must stay clean every iteration)
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
```

If any audit fails, the iteration stops, a session-log entry is written, and the orchestrator either fixes-and-retries or marks the slice blocked for the observer to redirect.

## Estimated Scope

10–18 commits across 4 sub-tracks. No GPU work, no model training. All work runnable on local Mac Studio MPS in under 30 minutes of CPU/runtime per sub-track. Estimated wall-clock for full mission: 1–3 days of autonomous-loop iterations, depending on tactical discoveries.

## Handoff to Mission 3

When the exit condition is met:

- Update `GOAL.md` `current mission` to **Mission 3: First Brev training round**.
- Active per-milestone prompt becomes `docs/model/rawframe-first-training-goal-loop-prompt.md` (to be authored at that point).
- Session log `docs/session-logs/NNN-mission-2-close.md` summarizes what landed and what carries forward.
- The runbook gets exercised by the human; first first-party clips land; mission 3 kicks off with real data.
