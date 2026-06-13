# Raw-Frame NVIDIA Access Goal Loop Prompt

## Mission

Move ASL Pilot's raw-frame model goal past the current PopSign-only quality
blocker by pursuing NVIDIA ASL / ASL 1000 access, retained accepted-access
evidence, metadata-only audit, and source-register readiness without importing
unapproved media or derived recognition artifacts.

## Source Of Truth

Order these sources by authority:

1. The user's latest explicit instructions in the active thread.
2. System/developer instructions, including AGENTS.md handling and the no-revert
   rule for user changes.
3. `docs/validation/rawframe-model-goal-progress.md`.
4. `docs/research/rawframe-data-decision.md`.
5. NVIDIA candidate-only evidence:
   `docs/research/nvidia-asl-source-rights-review.md`,
   `docs/research/nvidia-asl-access-request-packet.md`,
   `docs/research/nvidia-asl-external-rights-review-receipt.json`, and
   `docs/research/nvidia-asl-access-receipt.template.json`.
6. NVIDIA metadata audit gate:
   `scripts/audit_nvidia_asl_access_metadata.mjs` and
   `docs/research/nvidia-asl-metadata-audit.json`.
7. Public NVIDIA evidence retained under
   `artifacts/dataset-research/nvidia-asl/`.
8. `docs/model/dataset-source-register.json` and
   `docs/model/dataset-source-register.md`.
9. `docs/research/online-training-dataset-strategy.md` and
   `docs/model/rawframe-data-decision-goal-loop-prompt.md`.
10. The raw-frame model goal prompt:
    `docs/model/rawframe-model-goal-loop-prompt.md`.
11. Manifest schemas:
    `docs/model/rawframe-manifest-schema.md` and
    `docs/model/negative-challenge-manifest-schema.md`.
12. Current manifests, tensors, model artifacts, and browser artifacts under
    `data/`, `artifacts/rawframe-model/`, and `web/public/model/`.
13. Pipeline/audit scripts under `scripts/`, especially source-register,
    NVIDIA metadata, import, decode, train, evaluate, export, and browser-smoke
    gates.

## Intended Outcome

The repository has either a retained, hash-pinned accepted NVIDIA access
receipt plus a metadata-only audit ready for source-register review, or an
evidence-backed decision that NVIDIA remains blocked and another approved data
path must be used. No NVIDIA data becomes training, validation, test, or
negative-challenge evidence until the source register approves the exact
raw-video-only import scope.

## Acceptance Criteria

- The current PopSign-only blocker remains accurately recorded: the latest
  motion-temporal candidate is non-smoke and from scratch, but
  `artifacts/rawframe-model/validation-report.json` is still
  `candidate_final_validation_failed` and calibrated provenance is stale.
- The NVIDIA access request packet is current, accurate, and does not claim
  submission or approval unless a human operator has actually submitted it.
- If access has not been granted, `docs/research/nvidia-asl-metadata-audit.json`
  remains blocked on the missing accepted access receipt and metadata staging
  directory.
- If access is granted, `docs/research/nvidia-asl-access-receipt.json` uses the
  retained template schema with `status: accepted_access_retained`, operator and
  request fields, accepted license/terms booleans, raw-video-only commitments,
  and at least one hash-pinned accepted-access evidence attachment.
- Only metadata is staged before source-register approval, under
  `artifacts/dataset-research/nvidia-asl/metadata/`.
- Metadata staging excludes raw videos, extracted images, landmarks, pose files,
  face-mesh files, tensors, feature caches, pretrained models, detectors, and
  checkpoints.
- The metadata audit records label overlap with the current 95-label ASL Pilot
  vocabulary, signer/split evidence, raw-video path candidates, and any license
  or public-output constraints.
- No source-register entry is added unless the metadata audit supports the
  intended scope and the exact raw-video-only use is approved.
- No NVIDIA raw videos are imported, decoded, or used in manifests before
  source-register approval.
- If a different online source is considered, it receives the same rights,
  provenance, split, raw-video, and source-register treatment; do not use
  generated imagery as model evidence without a separate synthetic-data policy
  and validators.

## Evidence Standard

Before claiming completion, surface:

- changed files and generated artifact paths;
- whether access was not submitted, submitted, accepted, rejected, or still
  pending;
- retained source/access receipt paths and SHA-256 hashes;
- metadata staging path, file inventory, hashes, and explicit confirmation that
  no protected media or derived recognition artifacts were staged before
  approval;
- metadata audit status, label overlap counts, signer/split findings, raw-video
  path candidate counts, and blockers;
- source-register status and any source-register diff if approval is pursued;
- commands run and pass/fail status, especially
  `node scripts/audit_nvidia_asl_access_metadata.mjs --write`,
  `node scripts/audit_source_register.mjs`, and relevant guardrail audits;
- exact unresolved blocker evidence when the next step depends on human access
  submission, license acceptance, protected metadata availability, legal review,
  or explicit product scope change.

## Decision Status

Confirmed requirements:

- The final recognition path must remain from-scratch raw RGB frames.
- The current approved PopSign v1 route has real manifests and tensors but does
  not meet model-quality targets.
- NVIDIA ASL / ASL 1000 is candidate-only. Access is controlled, no local
  protected metadata exists, and the source register does not approve NVIDIA.
- Only raw NVIDIA videos could be eligible for ASL Pilot. Extracted images,
  hand landmarks, body poses, face meshes, feature caches, detectors,
  pretrained models, and checkpoints are disallowed for recognition.
- The retained access receipt template is not accepted access evidence and must
  continue to fail the metadata audit until a human-retained accepted receipt is
  created.
- Superseded by the 2026-05-25 user correction: do not auto-route to
  first-party collection when NVIDIA access is unavailable. Treat first-party
  collection as a dormant route unless the user explicitly reauthorizes it; the
  active fallback is source-register-safe online/external evidence or an
  explicit reduced-scope decision.

Assumptions:

- A human operator may need to submit the NVIDIA form because it requires
  identity, organization, business email, country, license acceptance, and use
  case details.
- Metadata review should happen before any raw-video import, even after access.
- Source-register approval may still be denied after access if license terms,
  label overlap, split metadata, or public-output constraints do not fit ASL
  Pilot.

Recommended defaults:

- Start by rerunning the NVIDIA metadata audit in the current worktree and
  confirming it fails for only the expected access/metadata blockers.
- Keep the access request packet aligned with the current raw-frame-only use
  case and latest model-quality evidence.
- If accepted access evidence appears, copy the template to
  `docs/research/nvidia-asl-access-receipt.json` and fill it only from retained
  evidence, not memory or intent.
- Stage metadata only, run the audit, and stop before any source-register or
  media import step unless the audit output justifies moving forward.

Open questions:

- Can a human operator submit and retain the NVIDIA access request?
- Do the accepted terms allow local training, browser ONNX artifacts, model
  cards, pilot submission evidence, and required attribution/no-publicity text?
- Does NVIDIA metadata contain enough labels overlapping the current 95-label
  vocabulary to justify import?
- Are signer identifiers and train/validation/test split fields strong enough
  for signer-disjoint evaluation?
- If NVIDIA remains blocked, which source-register-safe online/external route is
  next, or should the project explicitly accept a reduced-scope pilot?

## Execution Rhythm

1. Inspect the current progress ledger, NVIDIA evidence, source register, and
   metadata audit output.
2. Choose the smallest evidence-producing next step: access packet refresh,
   access receipt retention, metadata staging audit, or source-register review.
3. Act through existing scripts and retained docs rather than ad hoc imports.
4. Record commands, hashes, access status, metadata inventory, and blockers.
5. Compare progress against the acceptance criteria.
6. Continue until NVIDIA is ready for source-register review, explicitly
   rejected, or blocked on a human/external access condition.

## Progress Ledger

Use this compact format in updates:

```text
Current state:
Completed:
Evidence:
Remaining:
Blockers:
Next step:
```
