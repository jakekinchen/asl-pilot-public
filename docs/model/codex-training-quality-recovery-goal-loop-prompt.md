# Codex Training Quality Recovery Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this broad 95-label diagnosis prompt unless the user
explicitly approves a redirect away from the return-to-form milestone ladder.

Mission 3T prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md) first. This prompt starts after Mission 3S proved Brev execution works but three no-pretrained PopSign rawframe variants failed to generalize.

## Mission

Diagnose why the 95-label PopSign rawframe models overfit training data and fail signer-disjoint validation/test. Do not export, promote, or claim the current checkpoint as a working recognizer. Do not launch another paid training run until the next run has a concrete diagnostic reason.

## Source Of Truth

Authority order:

1. Latest user instruction: continue decisively, do not stop only because Brev costs money.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3T.
3. [`docs/session-logs/164-mission-3s-brev-training-runs.md`](../session-logs/164-mission-3s-brev-training-runs.md).
4. Current artifacts:
   - `artifacts/rawframe-model/training-provenance.json`
   - `artifacts/rawframe-model/training-clipnorm3d-e50.log`
   - `artifacts/rawframe-model/validation-report-smoke-nochallenge.json`
   - `artifacts/rawframe-model-diagnostics/brev-compact3d-e5-20260525T140937Z/`
   - `artifacts/rawframe-model-diagnostics/brev-motion2d-e35-20260525T141812Z/`
5. Existing diagnostic scripts: `scripts/analyze_rawframe_split_shift.py`, `scripts/analyze_rawframe_tensor_visuals.py`, `scripts/plan_rawframe_data_remediation.mjs`, and the current evaluation/export/audit chain.
6. [`ARCHITECTURE.md`](../../ARCHITECTURE.md): `#arch-no-pretrained`, `#arch-gpu-execution`, `#arch-active-module`, `#arch-data-provenance`, `#arch-browser-export`.

## Current Evidence

Mission 3S completed three Brev/A100 runs:

| run | best validation | final train | interpretation |
|---|---:|---:|---|
| compact 3D, 5 epochs | 1.22% | 1.01% | chance-level |
| motion 2D, 35 epochs | 6.48% | 99.54% | memorized train split |
| clipnorm 3D, 50 epochs | 6.99% | 91.03% | memorized train split |

Diagnostic smoke evaluation for the current clipnorm checkpoint reports test top-1 6.81%, macro-F1 5.54%, false-pass 21.99%, and `passes_targets: false`. Canonical final evaluation is additionally blocked by underfilled final-promotion negative-challenge types.

## Acceptance Criteria

All must be true before this recovery mission closes:

1. **Training failure is documented from current artifacts.**
   - Extract compact metrics for all three Brev runs into a durable diagnostic JSON or Markdown note.
   - Keep final-promotion blockers separate from training-quality blockers.

2. **Data/split diagnosis runs.**
   - Run the existing rawframe split/tensor diagnostics against `data/manifests/train.json`, `validation.json`, and `test.json`.
   - Inspect whether the failure is primarily split/signature shift, frame/tensor quality, label ambiguity, source leakage prevention, or model capacity.

3. **Next run is justified or deferred.**
   - If a new Brev run is justified, write the exact command and expected improvement target before launching it.
   - If data remediation is required, write the minimal remediation queue and do not launch more blind training.

4. **Brev worker status is explicit.**
   - The user said not to stop the worker yet. Continue to report whether `asl-pilot-rawframe-001` is still running and record `brev stop asl-pilot-rawframe-001` as the manual stop command.

5. **No false promotion.**
   - Do not run `export_onnx_model.py` or `promote_trained_model_card.mjs` for the current checkpoint unless a later evaluation meets the stated targets and final-promotion blockers are cleared or explicitly re-scoped by the user.

## First Reviewable Slice

Run a local diagnostic slice:

```sh
git status --short
node scripts/audit_loop_premise.mjs --json
./.venv/bin/python scripts/analyze_rawframe_split_shift.py --write
./.venv/bin/python scripts/analyze_rawframe_tensor_visuals.py --write
```

Then write a numbered session log that classifies the likely failure mode and the next training/data action.

## Evidence Standard

For every slice, surface:

- current `git status --short`;
- Brev worker status and manual stop command;
- exact commands run and pass/fail status;
- metrics for current and previous candidate runs;
- whether any new training run is evidence-driven or deferred;
- final-promotion negative-challenge blocker kept separate from training-quality diagnosis.

## Hard Limits

- No pretrained CV/sign/landmark/model dependencies.
- No raw learner video upload.
- No `git push`.
- No model-card hand edit.
- No final-gate weakening unless the user explicitly changes the gate in writing.
