# operator-handoff

**Round-001 task-026 vestige removal note (2026-05-23).**

The pre-round-001 version of this doc described the operator-facing
handoff for the Stage A browser-local target verifier (75-label teacher
frontier capture, ASL-Citizen primarymath ROI review chain, etc.).
After [`task-026`](../../MVP_TASKS.md#task-026) removed the Stage A
vestige, that handoff is obsolete.

The current operator handoff is the first-party dataset collection
flow.

## current operator handoff

The operator-facing surface is the dataset collection flow at `/`,
which is **disabled by default**. To enable it for a controlled
collection session:

1. **Confirm the collection plan is reviewed**. See
   [`scripts/audit_collection_plan_contract.mjs`](../../scripts/audit_collection_plan_contract.mjs)
   and [`scripts/audit_reviewed_vocabulary_collection_gate.mjs`](../../scripts/audit_reviewed_vocabulary_collection_gate.mjs).
   The collection plan must be at `review_gate.status === "reviewed"`
   or `"source_curated"` and SHA-256 bound to the current reviewed
   vocabulary evidence.

2. **Confirm signer identity is verified** for each participating
   signer alias. See
   [`scripts/run_signer_identity_pipeline.mjs`](../../scripts/run_signer_identity_pipeline.mjs)
   and the Ed25519 signer-identity evidence under
   `data/signer-identity/`.

3. **Run the dataset collection runtime smoke** before the session:
   ```bash
   node scripts/run_dataset_collection_runtime_smoke.mjs --write
   node scripts/audit_dataset_collection_readiness.mjs
   ```
   Both must pass.

4. **Enable the capture flow** with the two environment flags:
   ```bash
   export ENABLE_DATASET_COLLECTION=true
   export NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true
   npm --prefix web run dev
   ```
   Or in a built deploy, set them in the platform's environment
   configuration. Both flags are required.

5. **During capture**, the operator confirms front lighting,
   upper-torso + hands framing, pilot-range camera distance, and the
   isolated-prompt-sign condition for each clip. Capture-condition
   evidence is captured per clip and validated server-side.

6. **After capture**, run the post-collection review chain:
   ```bash
   node scripts/process_collected_dataset_evidence.mjs --apply
   ```
   This walks the clip-review and challenge-review packets through the
   trusted-reviewer-authority chain and either applies the review
   transactionally or rolls back on first blocker.

7. **Disable the capture flow** after the session by unsetting the
   two env flags.

## reference

- [`docs/privacy/dataset-consent-form.md`](../privacy/dataset-consent-form.md) —
  the consent contract that gates every clip.
- [`docs/model/dataset-source-register.md`](../model/dataset-source-register.md) —
  the source-of-truth register; first-party collection is the only
  `allowed_for_model_training: true` source.
- [`docs/model/dataset-and-training-plan.md`](../model/dataset-and-training-plan.md) —
  the post-vestige training plan.
- [`MVP_TASKS.md`](../../MVP_TASKS.md) — `task-007` for the dataset
  pull / collection task; `task-021` for the privacy chain.
- [`docs/briefs/001-stage-a-vestige-removal.md`](../briefs/001-stage-a-vestige-removal.md) — the task-026 brief.
