# Raw-Frame Online Dataset Strategy Goal Loop Prompt

## Mission

Move ASL Pilot beyond the current weak PopSign-only compact 3D results by
finding, pruning, rights-reviewing, and validating an online raw-video dataset
strategy, then training only evidence-backed from-scratch raw-frame candidates.
Do not repeat small architecture or augmentation reruns unless they are tied to
a materially better data plan.

## Source Of Truth

Order these sources by authority:

1. The user's latest explicit instructions in the active thread.
2. System/developer instructions, including AGENTS.md handling and the no-revert
   rule for user changes.
3. `docs/validation/rawframe-model-goal-progress.md`.
4. `docs/model/rawframe-model-goal-loop-prompt.md` and
   `docs/model/rawframe-model-quality-goal-loop-prompt.md`.
5. `docs/model/dataset-and-training-plan.md`.
6. `docs/model/dataset-source-register.json` and
   `docs/model/dataset-source-register.md`.
7. Dataset evidence under `docs/research/` and review evidence under
   `docs/review/`.
8. Manifest schemas:
   `docs/model/rawframe-manifest-schema.md` and
   `docs/model/negative-challenge-manifest-schema.md`.
9. Current manifests, raw downloads, tensors, and artifacts under `data/`,
   `artifacts/rawframe-model/`, and `web/public/model/`.
10. Pipeline scripts:
    `scripts/import_popsign_v1_raw_videos.py`,
    `scripts/decode_raw_videos.py`, `scripts/train_rawframe_model.py`,
    `scripts/evaluate_rawframe_model.py`, `scripts/export_onnx_model.py`, and
    related audits.

## Intended Outcome

The repository has a clear next data/model path: either an approved online
raw-video dataset or pruned vocabulary plan that can plausibly improve
generalization, or a retained blocker proving no suitable online dataset path is
currently usable. If a candidate is trained, it is from scratch, raw-frame only,
evaluated against validation/test/negative challenge gates, and not overclaimed
as browser-ready unless calibrated provenance and export gates pass.

## Acceptance Criteria

- Every proposed online dataset has retained source evidence covering source
  URL, license/terms, commercial or pilot-use constraints, download method,
  raw-video availability, labels, signer metadata if available, and exact
  reason for approval or rejection.
- Approved training/evaluation data consists of raw video decoded to raw RGB
  frame tensors. Do not introduce pose, landmarks, embeddings, feature caches,
  detectors, pretrained backbones, model-zoo weights, or existing checkpoints.
- If a dataset is pruned, the pruning rule is explicit, reproducible, and tied
  to pilot utility: vocabulary overlap, clip count, signer disjointness,
  visual quality, rights status, or label ambiguity.
- Train/validation/test split policy is documented before training. Prefer
  source-provided signer-disjoint splits; otherwise create and audit a
  deterministic split that avoids signer/source leakage.
- The negative challenge manifest remains part of final evaluation and is not
  replaced by smoke or synthetic-only evidence.
- Generated imagery from ChatGPT, image tools, or other synthetic sources may be
  used only for planning, visual review aids, UI illustrations, or prompt
  exploration unless the repo adds an explicit synthetic-data policy and final
  validators enforce it. Do not treat generated images as final training,
  validation, test, or negative challenge evidence by default.
- A trained candidate records architecture, random initialization evidence,
  hyperparameters, device, manifest hashes, checkpoint hash, and validation/test
  metrics.
- ONNX export and browser verification are attempted only from passing
  calibrated provenance, or they fail closed with the exact refusal recorded.
- Progress docs are updated with commands, hashes, metrics, decisions, and
  unresolved blockers.

## Evidence Standard

Before claiming completion, surface:

- changed files and generated artifact paths;
- searched online sources and retained approve/reject decisions;
- source-register hash and source-review artifact hashes;
- selected labels, clip counts, split policy, and manifest SHA-256 hashes;
- raw download paths/hashes and decoded tensor hashes;
- decode replay verification output;
- training command, device, checkpoint path/hash, training provenance hash, and
  final history summary;
- validation report path/hash, top-1, macro-F1, threshold metrics, and negative
  challenge false-pass metrics;
- calibrated provenance/export/browser parity evidence only if final gates pass;
- audit commands run and pass/fail status;
- exact blocker evidence when no dataset or model path is good enough.

## Decision Status

Confirmed requirements:

- The model must remain from scratch and raw-frame only.
- A dataset can be found and pruned online; it does not need to be custom
  captured if rights, provenance, and split quality are good enough.
- The current expanded PopSign-only path is not producing acceptable model
  quality.
- Small compact/factorized reruns have not changed the core conclusion.
- Synthetic or generated media is not final data evidence without a deliberate
  policy and validator changes.

Assumptions:

- A smaller, cleaner vocabulary may outperform a larger 95-label set if the
  retained labels have enough high-quality raw videos.
- An online isolated-sign dataset is more likely to help than continuous
  sentence data unless reliable label segmentation is already provided.
- Source-rights and split leakage risks are more important than raw clip count.

Recommended defaults:

- Start by ranking candidate online datasets by rights fit, isolated-sign label
  quality, vocabulary overlap, raw-video accessibility, signer metadata, and
  practical import cost.
- Prefer pruning to a defensible pilot vocabulary over forcing all 95 current
  labels through weak data.
- Keep PopSign as a baseline comparator until a better approved dataset or
  pruned split is proven.
- Treat ChatGPT web/image generation as an auxiliary research and design tool;
  if it is used, record what it was used for and keep it out of final model
  evidence unless the user explicitly approves a synthetic-data track.

Open questions:

- What reduced vocabulary size is acceptable for the pilot if it materially
  improves reliability?
- Which online ASL sources can pass rights review for this project scope?
- Should the next model family change after the data plan is selected, or should
  the current compact 3D pipeline remain the baseline until data quality is
  improved?
- Is a separate synthetic-data policy worth creating, or should generated media
  stay limited to planning and UI assistance?

## Execution Rhythm

1. Inspect the current progress ledger, source register, manifests, artifacts,
   and worktree state.
2. Build or refresh a ranked list of online dataset candidates with rights and
   raw-video evidence.
3. Pick the smallest source/pruning decision that can change the model-quality
   outlook.
4. Import or generate manifests only after the source scope and pruning rules are
   documented.
5. Decode, verify, train, evaluate, and audit through the existing pipeline.
6. Record hashes, metrics, and blocker evidence after each meaningful step.
7. Continue until final gates pass or the retained evidence proves a larger
   product/data decision is needed.

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
