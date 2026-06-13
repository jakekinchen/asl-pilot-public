# Raw-Frame Data Decision Goal Loop Prompt

## Mission

Choose and execute the next evidence-backed data strategy for ASL Pilot's
from-scratch raw-frame model after the expanded PopSign-only route failed model
quality gates. The goal is to move to a defensible next data path, not to repeat
small architecture or augmentation reruns against known-weak evidence.

## Source Of Truth

Order these sources by authority:

1. The user's latest explicit instructions in the active thread.
2. System/developer instructions, including AGENTS.md handling and the no-revert
   rule for user changes.
3. `docs/validation/rawframe-model-goal-progress.md`.
4. `docs/research/rawframe-data-decision.md`.
5. NVIDIA candidate-only evidence:
   `docs/research/nvidia-asl-source-rights-review.md`,
   `docs/research/nvidia-asl-access-request-packet.md`, and
   `docs/research/nvidia-asl-external-rights-review-receipt.json`.
6. NVIDIA metadata-only audit gate:
   `scripts/audit_nvidia_asl_access_metadata.mjs` and
   `docs/research/nvidia-asl-metadata-audit.json`.
7. `docs/research/online-training-dataset-strategy.md`.
8. `docs/research/ms-asl-source-rights-review.md` and retained MS-ASL candidate
   JSON files under `docs/research/`.
9. `docs/model/dataset-source-register.json` and
   `docs/model/dataset-source-register.md`.
10. `docs/model/rawframe-model-goal-loop-prompt.md`,
   `docs/model/rawframe-model-quality-goal-loop-prompt.md`, and
   `docs/model/rawframe-online-dataset-strategy-goal-loop-prompt.md`.
11. `docs/model/dataset-and-training-plan.md`.
12. Manifest schemas:
   `docs/model/rawframe-manifest-schema.md` and
   `docs/model/negative-challenge-manifest-schema.md`.
13. Current manifests, tensors, model artifacts, and browser artifacts under
    `data/`, `artifacts/rawframe-model/`, and `web/public/model/`.
14. Pipeline and audit scripts under `scripts/`, especially collection,
    source-register, decode, train, evaluate, export, and browser-smoke gates.

## Intended Outcome

The repository has a retained, actionable decision for the next data path: a
rights-approved pruned online/raw-video dataset, waiting for a better approved
source such as PopSign v2, or an explicit reduced pilot scope. As of the
2026-05-25 user correction, first-party collection is a dormant option only; do
not select it unless the user explicitly reauthorizes browser-capture data. If
implementation proceeds in the same loop, every imported clip is
source-approved, raw-video backed, split-audited, and evaluated through the
existing from-scratch raw-frame pipeline.

## Acceptance Criteria

- The decision compares at least these active paths: pruned online/external
  dataset, PopSign v2/waiting, and reduced-scope pilot. First-party collection
  may appear only as a rejected/dormant alternative unless the user explicitly
  reauthorizes it.
- The decision uses retained evidence, not intuition: source rights, clip
  availability, vocabulary coverage, signer/split quality, collection cost,
  review burden, and expected model-quality upside.
- No online dataset enters training until the source register approves the exact
  source scope and import method.
- No first-party dataset enters training unless the user later reauthorizes that
  route and `data/asl-pilot-store.json`, signer registry records, consent
  evidence, clip review evidence, challenge review evidence, and collection
  readiness audits pass.
- Generated imagery or image-model output may help planning, UI illustration,
  reviewer aids, or synthetic-data policy exploration, but it is not final train,
  validation, test, or negative-challenge evidence unless a separate
  synthetic-data policy and validators are added.
- Any reduced-vocabulary plan records label list, reason for inclusion/exclusion,
  clip counts by split, source decision, and effect on pilot claims.
- Any training run remains from scratch and raw-frame only: no MediaPipe,
  OpenPose, landmarks, embeddings, feature caches, detectors, pretrained
  backbones, model-zoo weights, or existing checkpoints.
- Progress docs are updated with decisions, commands, hashes, metrics, and
  blockers before claiming the loop is complete.

## Evidence Standard

Before claiming completion, surface:

- changed files and generated artifact paths;
- the selected data path and the rejected alternatives with concrete reasons;
- source-register status and source-review artifact hashes;
- collection-plan summary or online-pruning summary, depending on the selected
  path;
- label counts, clip counts, split policy, signer/source-disjointness evidence,
  and manifest hashes if manifests are created;
- decode replay, training, evaluation, calibration, ONNX export, and browser
  parity evidence only if that stage actually runs;
- audit commands run and pass/fail status;
- exact blocker evidence when the next step depends on user approval, signer
  collection, unreleased data, licensing permission, or explicit scope change.

## Decision Status

Confirmed requirements:

- The final recognition path must remain from-scratch raw RGB frames.
- PopSign v1 is expanded to all locally available approved train/validation
  clips plus the uniform test floor: 2,375 train clips, 2,375 validation clips,
  and 1,805 test clips. The latest motion-temporal candidate still produced
  weak held-out results: test top-1 `0.08919667590027701`, test macro-F1
  `0.08252574184488487`, test false-pass `0.14293628808864267`, and negative
  challenge false-pass `0.3`.
- MS-ASL is candidate-only. The 50-label metadata candidate fell to 14 labels
  after public-row availability filtering, which is too small for the current
  95-label final goal without explicit reduced-scope approval.
- NVIDIA ASL is candidate-only. The access page and license evidence are
  retained, but access has not been granted, no local NVIDIA metadata or video
  hashes exist, and no source-register entry approves NVIDIA. The retained
  metadata audit must stay blocked until an accepted access receipt and
  metadata-only staging directory exist.
- First-party collection is allowed by the source register after review, but it
  is not the active route after the 2026-05-25 user correction. The local store
  is absent and no first-party clips or final post-collection review evidence
  currently exist.
- The dataset does not have to be custom if a found/pruned online source passes
  rights, provenance, split, and raw-video gates.

Assumptions:

- A smaller, cleaner pilot vocabulary may be more useful than preserving all 95
  labels with weak or unavailable data.
- First-party collection is a dormant route with real operational cost: at the
  current targets it would need 1,425 vocabulary clips plus 20 negative challenge
  clips before manifest export, and it is not selected for the active plan.
- Waiting for PopSign v2 is only useful if release timing and video availability
  become concrete.

Recommended defaults:

- Start with a decision matrix rather than another PopSign-only model run.
- If choosing online data, prefer human-submitted NVIDIA access as the next
  evidence-producing step, then
  `node scripts/audit_nvidia_asl_access_metadata.mjs --write` before any media
  import. Do not spend more time on full MS-ASL import unless reduced scope is
  approved.
- Do not choose first-party collection from this prompt unless the user
  explicitly reauthorizes it in a later instruction.
- If choosing reduced scope, update the claims and vocabulary plan before any
  training attempt.

Open questions:

- What reduced vocabulary size is acceptable for a useful pilot?
- Is reduced scope operationally acceptable if currently approved online/external
  evidence cannot support the full vocabulary?
- Is waiting for PopSign v2 acceptable, or does the project need progress from
  currently available sources?
- Should the repo add a deliberate synthetic-data policy, or should generated
  media stay out of model evidence?
- Can a human operator submit the NVIDIA access request and retain accepted
  terms for source-register review?

## Execution Rhythm

1. Inspect the current progress ledger, source register, worktree, manifests,
   and collection/source evidence.
2. Build a compact decision matrix for online-pruned/external, PopSign v2, and
   reduced-scope paths, with first-party only as a dormant/rejected route.
3. Pick the smallest evidence-producing next step that can change the decision.
4. Act through existing scripts and retained docs rather than ad hoc data paths.
5. Record commands, hashes, metrics, and blockers.
6. Compare progress against the acceptance criteria.
7. Continue until a selected path is ready for implementation or the blocker is
   explicit enough for a user/product decision.

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
