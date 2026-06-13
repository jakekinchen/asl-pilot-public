# Raw-Frame Model Quality Goal Loop Prompt

## Mission

Improve the ASL Pilot from-scratch raw-frame model candidate after the negative
challenge path has been made real. Preserve the no-pretrained-components
constraint, keep PopSign split boundaries intact, and either produce a passing
final browser-ready candidate or document a hard, evidence-backed model-quality
blocker.

## Source Of Truth

Order these sources by authority:

1. The user's latest explicit instructions in the active thread.
2. System/developer instructions, including AGENTS.md handling and the no-revert rule.
3. `docs/validation/rawframe-model-goal-progress.md`.
4. `docs/model/rawframe-model-goal-loop-prompt.md`.
5. `docs/model/dataset-and-training-plan.md`.
6. `docs/model/rawframe-manifest-schema.md` and `docs/model/negative-challenge-manifest-schema.md`.
7. `docs/model/dataset-source-register.json` plus source evidence in `docs/research/`.
8. Current manifests and tensors under `data/manifests/`, `data/external/`, and `data/tensors/`.
9. Pipeline scripts: `scripts/import_popsign_v1_raw_videos.py`, `scripts/decode_raw_videos.py`, `scripts/train_rawframe_model.py`, `scripts/evaluate_rawframe_model.py`, `scripts/export_onnx_model.py`, and related audits.
10. Existing model artifacts and reports under `artifacts/rawframe-model/`, `docs/validation/`, and `web/public/model/`.

## Intended Outcome

The repository has either a calibrated final raw-frame model that passes
held-out signer evaluation, negative challenge rejection, ONNX export, and
browser parity, or a concise retained report proving why the current approved
data/model path cannot meet those gates yet.

## Acceptance Criteria

- Train/validation/test manifests validate, preserve PopSign split boundaries,
  remain signer-disjoint, and use only approved raw RGB video sources.
- Any dataset expansion uses source-register-approved raw videos, records exact
  manifest hashes, and decodes hash-pinned frame tensors with replayable FFmpeg
  provenance.
- Training uses random initialization with `pretrained_components: []`; no
  MediaPipe, OpenPose, landmarks, embeddings, pretrained detectors, pretrained
  backbones, checkpoints, or feature extractors are introduced.
- A candidate training run records enough hyperparameter and architecture
  evidence to explain whether it is final evidence or only a diagnostic probe.
- Final evaluation includes validation, test, and negative challenge metrics.
  It writes calibrated provenance only if the target gates pass.
- ONNX export and browser parity are attempted only from passing calibrated
  provenance, or they fail closed with the exact refusal recorded.
- Docs describe the current metrics, hashes, commands, and remaining blocker
  without overclaiming pilot readiness.

## Evidence Standard

Before claiming completion, surface:

- changed files and generated artifact paths;
- manifest counts and SHA-256 hashes for train, validation, test, and negative
  challenge;
- decode verification output;
- training command, device, checkpoint path, training-provenance hash, and
  final training history;
- validation report path/hash, top-1, macro-F1, threshold metrics, and negative
  challenge false-pass metrics;
- calibrated provenance path/hash if and only if evaluation passed;
- ONNX/export/browser parity evidence if and only if calibrated provenance
  passed;
- audit commands run and their pass/fail status;
- any unresolved blocker with exact command output or artifact evidence.

## Decision Status

Confirmed requirements:

- The model must remain raw-frame only and from scratch.
- The negative challenge manifest exists and should remain part of final
  evaluation.
- The current 50-epoch motion-temporal 2D CNN candidate failed final
  evaluation after using all locally available approved PopSign train and
  validation clips plus the uniform test floor.
- The active PopSign manifests contain 25 clips per label for train, 25 clips
  per label for validation, and 19 clips per label for test. Further uniform
  PopSign expansion is capped by current approved source availability.
- Stale smoke ONNX artifacts must not be treated as final browser evidence.

Assumptions:

- Additional signer/source diversity is more likely to matter than another
  small PopSign-only hyperparameter rerun.
- A new model run is useful only with a materially new generalization
  hypothesis or newly approved raw-video evidence.
- A small diagnostic probe is useful only if it records what decision it can
  change; it is not final evidence unless retained through the audited
  training/evaluation/export pipeline.

Recommended defaults:

- Use `docs/validation/rawframe-model-goal-progress.md` and
  `docs/research/rawframe-data-decision.md` before choosing another model run.
  Do not default to more compact/factorized/motion-temporal PopSign-only reruns.
- If changing architecture, keep the public architecture identifier compatible
  with final gates or update all dependent audit/export/model-card contracts in
  the same pass.
- If adding data, use only source-register-approved raw videos and preserve
  signer/split boundaries before retraining.
- Prefer fail-closed docs over lowering readiness gates without explicit user
  approval.

Open questions:

- What pilot threshold is acceptable if the strict 0.70 top-1 and 0.65 macro-F1
  targets remain unreachable without pretraining?
- Should additional approved ASL datasets be sourced if larger PopSign imports
  still do not generalize?

## Execution Rhythm

1. Inspect the current manifests, artifacts, and latest progress ledger.
2. Choose the smallest evidence-producing step: data expansion, model change, or
   evaluation/audit refresh.
3. Act through existing pipeline scripts where possible.
4. Record command output, hashes, and metrics.
5. Compare the result against the acceptance criteria.
6. Continue until the final gates pass or the blocker is proven with retained
   evidence.

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
