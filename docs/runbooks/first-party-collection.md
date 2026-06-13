# First-Party Dataset Collection Runbook

Exact commands a human operator runs to collect first-party consented ASL clips for the rawframe lane. Anchored to [`#arch-first-party-data`](../../ARCHITECTURE.md#arch-first-party-data), [`#arch-camera-privacy`](../../ARCHITECTURE.md#arch-camera-privacy), and [`#arch-data-provenance`](../../ARCHITECTURE.md#arch-data-provenance). Closes mission 2 exit-condition #5 of [`docs/model/rawframe-trainability-goal-loop-prompt.md`](../model/rawframe-trainability-goal-loop-prompt.md).

This runbook is for **humans**. The autonomous loop never provisions Brev, never asks for camera permission, never collects signer data.

## Smoke evidence the chain works

The exact end-to-end runtime wiring of steps 4–7 below is proven by:

- [`scripts/run_dataset_collection_runtime_smoke.mjs --write`](../../scripts/run_dataset_collection_runtime_smoke.mjs) — last passing report at [`docs/validation/dataset-collection-runtime-smoke.json`](../validation/dataset-collection-runtime-smoke.json) (status `passed`, 0 blockers).
- [`scripts/audit_dataset_collection_runtime_smoke.mjs`](../../scripts/audit_dataset_collection_runtime_smoke.mjs) — verifies the report is `finality: smoke_only` and `excluded_from_completion: true`.

The smoke builds its own isolated fixture under `output/dataset-collection-runtime-smoke/` (gitignored), so it does not contaminate real signer evidence.

## Preconditions

Before any human-signer session:

1. **Storage budget within bounds.**
   ```sh
   bash scripts/storage_budget_check.sh
   ```
   Must exit 0 (free space ≥ 250 GiB, project ≤ 650 GiB per [`configs/storage-budget.json`](../../configs/storage-budget.json)).

2. **Source-curated vocabulary review is current.**
   ```sh
   node scripts/audit_vocabulary_review.mjs
   ```
   Must report `status: "source_curated"`. If `vocabulary_source.sha256` doesn't match `web/src/lib/vocabulary.ts`, refresh via `node scripts/promote_source_curated_vocabulary.mjs --write` first.

3. **Hint metadata + active-module declaration in place.**
   ```sh
   node scripts/audit_hint_pedagogy_review.mjs
   node scripts/audit_downstream_vocabulary_provenance.mjs
   ```
   Both must pass. `audit_downstream_vocabulary_provenance.mjs` includes the `active_vocabulary_claim_present` and `active_sign_modules_example_present` checks added under task-005.

4. **No-pretrained invariants intact.**
   ```sh
   node scripts/audit_no_pretrained_deps.mjs
   node scripts/audit_no_pretrained_artifact_json.mjs
   ```
   Both must report 0 findings.

5. **Signed consent form on disk for every signer.** See [`docs/privacy/dataset-consent-form.md`](../privacy/dataset-consent-form.md) — print, sign, scan, store privately. The runbook does NOT commit signed consent forms to git.

6. **Reviewer authority chain ready.** The Ed25519 reviewer authority record under `data/vocabulary-review/evidence/` must be current. The runbook does not modify this chain; it consumes it.

## Step 1 — Plan the collection session

Build the operator collection plan. Signer aliases are chosen deterministically so the train/validation/test split is signer-disjoint:

```sh
node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json
node scripts/audit_collection_plan_contract.mjs
node scripts/audit_dataset_collection_readiness.mjs
node scripts/audit_reviewed_vocabulary_collection_gate.mjs
```

All four must succeed. If `audit_collection_plan_contract.mjs` complains about a draft plan, the vocabulary review evidence is stale — return to precondition #2.

## Step 2 — Prepare the operator session bundle

```sh
node scripts/prepare_collection_session_bundle.mjs
```

Produces per-signer capture CSVs and operator sheets from the accepted collection plan. Reject draft plans (`--allow-draft` exists for pre-evidence planning only; never for capture).

## Step 3 — Register signer identity evidence

For each consented signer:

```sh
# Dry-run first to validate the packet:
node scripts/import_signer_identity_evidence.mjs \
  --input data/signer-identity/signer-NNN-identity-evidence.json

# When the validation passes, commit the stamp to the local store:
node scripts/import_signer_identity_evidence.mjs \
  --input data/signer-identity/signer-NNN-identity-evidence.json \
  --write
```

`data/signer-identity/` and the signed real-person evidence packets are never committed to git. They live on the operator's machine alongside the signed paper consent forms.

## Step 4 — Build the app in collection mode

**Build-time precondition.** The `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION` flag is baked at build time; a default build (`npm --prefix web run build` with no flags) bakes `false` and the dataset routes refuse every call. The smoke surfaced this in [session-log slice 5 of round 001](../session-logs/006-mission-2-task-006-brev-scripts.md). Build explicitly:

```sh
NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true \
ENABLE_DATASET_COLLECTION=true \
  npm --prefix web run build
```

After the collection session ends, restore the default-safe posture with a plain `npm --prefix web run build`.

## Step 5 — Run the app in collection mode

In a dedicated terminal:

```sh
ASL_PILOT_AUTH_PROVIDER=local \
ENABLE_DATASET_COLLECTION=true \
NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true \
ASL_PILOT_STORE_PATH=data/asl-pilot-store.json \
ASL_PILOT_DATASET_CLIP_ROOT=data/dataset/clips \
ASL_PILOT_COLLECTION_PLAN_PATH=data/dataset/collection-plan.json \
ASL_PILOT_VOCABULARY_SOURCE_PATH=web/src/lib/vocabulary.ts \
ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH=docs/review/final-vocabulary-review.json \
  npm --prefix web start
```

The operator:

1. Opens `http://127.0.0.1:3000`, registers a session under their own operator account.
2. Selects a signer from the plan.
3. For each `(signer, label, split)` triple in the plan: reads the prompt to the signer, records the clip, reviews framing/handshape on playback, submits or re-records.
4. For each `(signer, challenge_type)` in the negative-challenge plan: same loop with the documented reject behavior.

Every saved clip enters `labelReviewStatus = needs_qa` (vocabulary clips) or `challengeReviewStatus = needs_review` (challenge clips). **Nothing is exportable until human review approves it.**

## Step 6 — Audit the in-flight collection bundle

After each signer's session (or at the end of the day):

```sh
node scripts/process_collected_dataset_evidence.mjs --write
node scripts/audit_collection_session_bundle.mjs
node scripts/audit_dataset_coverage_contract.mjs
```

`process_collected_dataset_evidence.mjs` snapshots the local store into a reviewable bundle. The two audits verify coverage math, plan-assignment uniqueness, and that nothing has slipped past `pending` into `approved` without human action.

## Step 7 — Sign consent receipts and review clips

Per signer:

```sh
node scripts/draft_signed_consent_receipt.mjs \
  --signer signer-NNN \
  --output data/dataset/consent-receipts/signer-NNN-receipt.json
```

The receipt template is signed offline (Ed25519, same key chain as reviewer authority). Then a reviewer marks each clip approved or rejected via the in-app review surface or by editing the local store's review state and running:

```sh
node scripts/draft_post_collection_review_receipt.mjs \
  --signer signer-NNN \
  --output data/dataset/review-receipts/signer-NNN-review.json
node scripts/audit_post_collection_evidence_status.mjs
node scripts/report_post_collection_evidence_status.mjs
```

`audit_post_collection_evidence_status.mjs` must pass before manifest export.

## Step 8 — Export approved-only training manifests

```sh
node scripts/export_dataset_manifests.mjs \
  --output data/dataset/manifests
```

Per [`#arch-data-provenance`](../../ARCHITECTURE.md#arch-data-provenance), `export_dataset_manifests.mjs` requires `vocabularyReviewGate` to pass and embeds the accepted vocabulary evidence into every manifest row. Approved clips become the rawframe lane's training/val/test split; rejected and pending clips are excluded.

## Bail-out — incomplete signer roster

**If any single signer cannot complete their session** (technical failure, withdrew consent, unavailable, did not pass identity validation, etc.):

1. **Log the failure** — append an entry under `data/dataset/signer-failures.log` (gitignored) with: signer alias, date, reason, recovery plan.
2. **Continue** — do NOT block the rest of the roster on one incomplete signer.
3. **Re-plan downstream** if the bail-out drops the train/validation/test split below the gate threshold (≥12 train, ≥4 validation, ≥4 test signers). Re-running `plan_dataset_collection.mjs` after the failure adjusts assignments; the audits in steps 1 and 6 surface the shortfall.
4. **Document in the round close-out** under `docs/session-logs/NNN-mission-3-collection-day.md` so the next mission has the failure record.

## Failure modes seen in the smoke

| symptom | root cause | fix |
|---|---|---|
| `{"error": "Dataset collection is disabled by default..."}` on any `/api/dataset/*` route | Build was made without `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true` (the client-side gate is baked at build time) | Rebuild with the env var set (step 4 above) |
| `Missing web/.next/BUILD_ID` from the smoke harness | Did not build at all | Run step 4 |
| `audit_collection_plan_contract.mjs` rejects the plan as draft | Vocabulary review evidence is stale or `--allow-draft-unreviewed-vocabulary` was passed to the planner | Refresh via `node scripts/promote_source_curated_vocabulary.mjs --write` and replan |
| `duplicate vocabulary plan assignment must be rejected` blocker in the smoke | Test environment regression in the plan-assignment guard | Re-run the smoke; if it persists, file a session log and request observer redirect |

## What this runbook is NOT

- Not a substitute for the consent form or for Deaf-educator / qualified-ASL-instructor review when external review becomes available. The current source-curated evidence mode is named in [`docs/review/final-vocabulary-review.json`](../review/final-vocabulary-review.json) as `source_curated_no_external_review`.
- Not a Brev provisioning runbook. Training lives in mission 3+; see [`scripts/brev_create_48h.sh`](../../scripts/brev_create_48h.sh) and friends.
- Not a recovery runbook for corrupted local stores. Restore from the last `process_collected_dataset_evidence.mjs --write` snapshot and replay.
