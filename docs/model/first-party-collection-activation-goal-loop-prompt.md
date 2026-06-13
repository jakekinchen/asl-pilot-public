# First-Party Collection Activation Goal Loop Prompt

> Superseded 2026-05-25 by
> [`docs/model/rawframe-non-first-party-data-route-goal-loop-prompt.md`](rawframe-non-first-party-data-route-goal-loop-prompt.md).
> This prompt was introduced by commit `5d38ab7` as an erroneous redirect from
> the active data-route plan. Do not use it unless the user explicitly
> reauthorizes first-party browser-capture collection in a later instruction.

Mission 3V prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after Mission 3U proved the NVIDIA access path is
blocked on missing accepted access and metadata evidence, while the local
first-party collection stack can still be advanced.

## Mission

Move the project from "data-source blocker" to an executable first-party
capture session. The goal is to keep the loop doing concrete unblock work:
refresh the active collection queue, prove the collection API/UI load it,
prepare the operator handoff bundle, and leave the exact capture command/URL
ready for a human signer session.

Do not treat an absent `data/asl-pilot-store.json` as a terminal blocker. The
runtime can initialize an empty store; the real gate is collecting and reviewing
consented clips.

## Source Of Truth

Authority order:

1. Latest user instruction: keep pushing forward and move to the next task that
   unblocks progress.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3V.
3. [`docs/session-logs/166-mission-3u-nvidia-access-audit.md`](../session-logs/166-mission-3u-nvidia-access-audit.md).
4. Current collection evidence:
   - [`docs/validation/canonical-verifier-manifests.json`](../validation/canonical-verifier-manifests.json)
   - [`docs/validation/canonical-verifier-collection-packet.json`](../validation/canonical-verifier-collection-packet.json)
   - [`docs/validation/controlled-pilot-remediation-queue-api-smoke.json`](../validation/controlled-pilot-remediation-queue-api-smoke.json)
   - [`docs/validation/dataset-collection-ui-queue-smoke.json`](../validation/dataset-collection-ui-queue-smoke.json)
   - [`docs/validation/first-party-store-preflight.json`](../validation/first-party-store-preflight.json)
5. Collection implementation and runbooks:
   - [`docs/runbooks/first-party-collection.md`](../runbooks/first-party-collection.md)
   - [`docs/handoff/CHECKLIST.md`](../handoff/CHECKLIST.md)
   - `web/src/app/api/dataset/plan/route.ts`
   - `web/src/components/DatasetCollectionPanel.tsx`
   - `web/src/lib/server-store.ts`
6. Existing collection scripts:
   - `scripts/export_canonical_verifier_manifests.mjs`
   - `scripts/export_canonical_verifier_collection_packet.mjs`
   - `scripts/export_canonical_verifier_collection_queue.mjs`
   - `scripts/prepare_collection_session_bundle.mjs`
   - `scripts/audit_collection_session_bundle.mjs`
   - `scripts/run_controlled_pilot_queue_api_smoke.mjs`
   - `scripts/run_dataset_collection_ui_queue_smoke.mjs`
   - `scripts/audit_first_party_store_preflight.mjs`

## Acceptance Criteria

All must be true before this mission closes:

1. **Goal-loop premise is clean.**
   - `node scripts/audit_loop_premise.mjs --json` exits 0.
   - `GOAL.md` has no `<stop-orchestrator/>` sentinel and points at this prompt.

2. **Active first-party queue exists and is current.**
   - `node scripts/export_canonical_verifier_manifests.mjs --write`
   - `node scripts/export_canonical_verifier_collection_packet.mjs --write`
   - `node scripts/export_canonical_verifier_collection_queue.mjs --write`
   - Retain the committed planning summaries under `docs/validation/`.
   - The ignored runtime queue under `data/dataset/` may exist locally but must
     not be committed as raw data evidence.

3. **Collection API/UI prove the queue is usable.**
   - `node scripts/run_controlled_pilot_queue_api_smoke.mjs --write` passes.
   - `node scripts/run_dataset_collection_ui_queue_smoke.mjs --write` passes.
   - The smoke evidence names the first active row and keeps `finality:
     queue_ready_not_training_data`.

4. **Operator session bundle is ready.**
   - `node scripts/prepare_collection_session_bundle.mjs` reports
     `ready_for_capture`.
   - `node scripts/audit_collection_session_bundle.mjs --require-ready` passes.

5. **Next action is executable.**
   - Write a numbered session log with exact collection-mode build/start
     commands, active first assignment, store path, clip root, and manual Brev
     stop command.
   - If a signer/operator is available, start the collection-mode app and give
     the local URL.

6. **No false evidence.**
   - Do not create synthetic clips, hand-edit collection review state, export
     manifests, train, export ONNX, or promote a model unless real consented
     clips exist and the review/export audits pass.

## First Reviewable Slice

Run:

```sh
git status --short
node scripts/audit_loop_premise.mjs --json
node scripts/export_canonical_verifier_manifests.mjs --write
node scripts/export_canonical_verifier_collection_packet.mjs --write
node scripts/export_canonical_verifier_collection_queue.mjs --write
node scripts/run_controlled_pilot_queue_api_smoke.mjs --write
node scripts/run_dataset_collection_ui_queue_smoke.mjs --write
node scripts/prepare_collection_session_bundle.mjs
node scripts/audit_collection_session_bundle.mjs --require-ready
node scripts/audit_first_party_store_preflight.mjs --write
brev ls --json
```

Then write a numbered session log and commit the slice.

## Evidence Standard

Surface:

- changed files and generated artifact paths;
- first queue assignment key, label, split, and signer alias;
- collection session bundle manifest hash;
- whether the canonical store is absent, empty, or contains real clips;
- Brev worker status and manual stop command;
- exact commands run and pass/fail status;
- any remaining action that requires a human signer/operator.

## Hard Limits

- No pretrained CV/sign/landmark/model dependencies.
- No raw learner video upload during normal practice.
- No synthetic clips as training, validation, test, or negative-challenge
  evidence.
- No `git push`.
- No final-gate weakening unless the user explicitly changes the gate in
  writing.
