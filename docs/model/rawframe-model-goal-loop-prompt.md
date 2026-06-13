# Raw-Frame Model Goal Loop Prompt

## Mission

Train, evaluate, calibrate, export, and browser-verify a from-scratch ASL Pilot
raw-frame model using the approved PopSign v1 train/validation/test manifests,
while preserving the no-pretrained-components constraint and resolving the
remaining negative challenge evidence requirement before any final quality claim.

## Source Of Truth

Order these sources by authority:

1. The user's latest explicit instructions in the active thread.
2. System/developer instructions, including AGENTS.md handling and the no-revert rule for user changes.
3. `docs/model/dataset-and-training-plan.md`.
4. `docs/model/rawframe-manifest-schema.md` and `docs/model/negative-challenge-manifest-schema.md`.
5. `docs/model/dataset-source-register.json` plus PopSign evidence in `docs/research/popsign-v1-source-audit.json`, `docs/research/popsign-v1-source-review.md`, and `docs/research/popsign-v1-import-plan.json`.
6. Current local manifests and tensors: `data/manifests/{train,validation,test}.json`, `data/external/popsign-v1/raw/`, and `data/tensors/`.
7. Pipeline scripts: `scripts/train_rawframe_model.py`, `scripts/decode_raw_videos.py`, `scripts/evaluate_rawframe_model.py`, `scripts/export_onnx_model.py`, `scripts/audit_final_rawframe_pipeline_preflight.mjs`, `scripts/run_final_browser_onnx_smoke.mjs`, and related audits.
8. Existing validation docs in `docs/validation/`, especially `docs/validation/validation-report.md` and `docs/validation/local-ml-environment.json`.

## Intended Outcome

The repository has a candidate final ASL Pilot model artifact trained from
approved raw RGB frame tensors, calibrated on signer-disjoint validation data,
tested on signer-disjoint test data, checked against reject-only negative
challenge clips, exported to ONNX for the browser app, and backed by retained
machine-readable evidence. The final docs describe the real metrics and
limitations without overclaiming.

## Acceptance Criteria

- The PopSign train/validation/test manifests still validate with `--check-files`, contain 95 labels, contain at least five clips per label per split, and retain signer-disjoint splits.
- Every training/evaluation clip has a hash-pinned tensor and replayable FFmpeg decode provenance; `scripts/decode_raw_videos.py --verify-only` passes for train, validation, and test.
- A negative challenge manifest exists at `data/manifests/negative-challenge.json`, passes the documented validator, uses approved raw video with rights/provenance evidence, and is signer/source-disjoint enough for reject-only evaluation.
- Training produces a non-smoke checkpoint and `artifacts/rawframe-model/training-provenance.json` from random initialization with `pretrained_components: []`.
- Evaluation produces `artifacts/rawframe-model/validation-report.json` and `artifacts/rawframe-model/calibrated-provenance.json`, with real validation/test metrics and negative challenge false-pass evidence.
- ONNX export produces the browser artifact and parity fixture required by the current export/audit scripts.
- Browser verification proves the app loads the final ONNX artifact and the browser logits/top label match the PyTorch parity fixture within the required tolerance.
- Final audits pass or report only explicitly documented non-final blockers: model artifacts, final browser serving, no-pretrained JSON/artifact checks, vocabulary/source provenance, and completion readiness.
- Docs are updated to reflect the exact current artifact status, metrics, hashes, and limitations.

## Evidence Standard

Before claiming completion, surface:

- changed files and generated artifact paths;
- manifest hashes and counts for train/validation/test/negative-challenge;
- decode replay verification output;
- training command, device, checkpoint path, and training provenance hash;
- evaluation report path, calibrated provenance path, validation/test metrics, and negative challenge false-pass result;
- ONNX export output and browser parity/browser smoke evidence;
- audit commands run and whether each passed or failed;
- any unresolved blocker with the exact file, command, or external condition that proves it.

Do not treat a dry-run, smoke run, synthetic fixture, or missing negative
challenge manifest as final model evidence.

## Decision Status

Confirmed requirements:

- The model path must remain raw-frame only: no MediaPipe, OpenPose, landmarks, embeddings, pretrained detectors, pretrained backbones, checkpoints, model-zoo weights, or feature extractors.
- PopSign v1 original game videos are approved only through the current source-register decision and retained source evidence.
- Source train/validation/test split boundaries must remain intact.
- Final evaluation must include reject-only negative challenge evidence; train/validation/test PopSign manifests alone are not enough for final pilot readiness.
- Final non-smoke training and evaluation must use the verified local ML environment and record the runtime device required by the current scripts.

Assumptions:

- The ignored local PopSign raw videos and decoded tensors may exist from the prior import. If they are absent, rerun the PopSign import and decode commands from the source-of-truth docs.
- The 95-label PopSign-backed vocabulary remains the intended label set unless the user changes it.
- A minimal first final candidate can use the existing default hyperparameters unless evidence suggests a targeted adjustment.

Recommended defaults:

- Start with the existing `compact_3d_cnn_spatiotemporal` architecture and current manifest/tensor files.
- Preserve the existing file paths expected by final gates: `data/manifests/*.json`, `data/tensors/`, and `artifacts/rawframe-model/`.
- Prefer making the negative challenge path real and auditable over lowering final-readiness requirements.

Open questions:

- What approved source should provide negative challenge raw videos if first-party capture is unavailable?
- What metric threshold is acceptable for a pilot demo if the first trained PopSign model is weak?
- Should training be optimized for quick candidate evidence first, or for a longer accuracy-focused run?

## Execution Rhythm

1. Inspect the current worktree, active ignored data files, and latest manifest hashes.
2. Choose the smallest useful step that moves toward final model evidence.
3. Act with the existing pipeline scripts rather than inventing parallel tooling.
4. Record command output and artifact hashes.
5. Compare progress against the acceptance criteria.
6. Continue until all acceptance criteria are met or an evidence-backed blocker remains.

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
