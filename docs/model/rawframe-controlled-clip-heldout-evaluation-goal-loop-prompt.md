# Rawframe Controlled Clip-Heldout Evaluation Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this controlled clip-heldout evaluation prompt unless the
user explicitly approves a redirect away from the return-to-form milestone
ladder.

Mission 3AA prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after Mission 3Z commit `76b834b` completed the WLASL
tensor remediation and controlled clip-heldout Brev training relaunch.

## Mission

Evaluate the newly trained controlled clip-heldout checkpoint and refresh the
quality evidence that depends on it. Do not export, promote, or claim readiness
unless the evaluator and downstream audits justify it.

This is a controlled-pilot fallback evaluation, not signer-disjoint final
promotion evidence. Keep final-promotion negative-challenge blockers separate
from controlled clip-heldout model-quality evidence.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread: keep moving, use the
   existing paid Brev worker if needed, and do not stop it.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AA.
3. [`docs/session-logs/179-mission-3z-wlasl-tensor-remediation-relaunch.md`](../session-logs/179-mission-3z-wlasl-tensor-remediation-relaunch.md).
4. New checkpoint artifacts:
   - `artifacts/rawframe-model-clip-heldout/model_state.pt`
   - `artifacts/rawframe-model-clip-heldout/training-provenance.json`
   - [`docs/validation/controlled-clip-heldout-relaunch-20260525T181826Z.log`](../validation/controlled-clip-heldout-relaunch-20260525T181826Z.log)
5. Remediated controlled clip-heldout manifests:
   - `data/manifests/controlled-pilot-clip-heldout/train.json`
   - `data/manifests/controlled-pilot-clip-heldout/validation.json`
   - `data/manifests/controlled-pilot-clip-heldout/test.json`
   - [`docs/validation/controlled-pilot-clip-heldout-manifests.json`](../validation/controlled-pilot-clip-heldout-manifests.json)
6. Current negative challenge manifest:
   - `data/manifests/negative-challenge.json`
   - [`docs/validation/final-manifest-audit.json`](../validation/final-manifest-audit.json), if refreshed
7. Existing scripts:
   - `scripts/evaluate_rawframe_model.py`
   - `scripts/audit_controlled_pilot_model_strategy.mjs`
   - `scripts/audit_controlled_pilot_source_remediation_status.mjs`
   - `scripts/audit_controlled_pilot_readiness.mjs`
   - `scripts/audit_final_manifests.py`

## First Reviewable Slice

Start with read-only state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
brev ls --json
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && pgrep -af "[t]rain_rawframe_model.py" || true && nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader'
```

Then evaluate the new checkpoint. Run locally if the copied-back tensors and
artifacts are present; otherwise use the existing Brev worker, then copy the
refreshed report artifacts back locally before committing.

```sh
./.venv/bin/python scripts/evaluate_rawframe_model.py \
  --controlled-clip-heldout \
  --checkpoint artifacts/rawframe-model-clip-heldout/model_state.pt \
  --training-provenance artifacts/rawframe-model-clip-heldout/training-provenance.json \
  --train-manifest data/manifests/controlled-pilot-clip-heldout/train.json \
  --validation-manifest data/manifests/controlled-pilot-clip-heldout/validation.json \
  --test-manifest data/manifests/controlled-pilot-clip-heldout/test.json \
  --challenge-manifest data/manifests/negative-challenge.json \
  --output-report artifacts/rawframe-model-clip-heldout/validation-report.json \
  --calibrated-provenance artifacts/rawframe-model-clip-heldout/calibrated-provenance.json \
  --prediction-sidecar artifacts/rawframe-model-clip-heldout/prediction-sidecar.json \
  --batch-size 8
```

The evaluator may fail non-zero if the model misses targets. That is still a
valid evidence-producing result if it refreshes the validation report and
sidecar. Do not hide the failure; record exact metrics and status.

Refresh or re-run the controlled-pilot audits that consume this validation
report:

```sh
node scripts/audit_controlled_pilot_model_strategy.mjs --write
node scripts/audit_controlled_pilot_source_remediation_status.mjs --write
node scripts/audit_controlled_pilot_readiness.mjs --write
./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json
```

The final-manifest audit is expected to remain blocked on underfilled
final-promotion negative-challenge types unless the manifest changed. Record it
as a final-promotion blocker, not a reason to skip controlled clip-heldout
evaluation.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and `node scripts/audit_loop_premise.mjs --json` exits 0.
2. `node scripts/audit_source_register.mjs` exits 0.
3. The executor verifies the existing `asl-pilot-rawframe-001` worker remains
   `RUNNING`, `READY`, and `HEALTHY`; no duplicate worker is created and the
   worker is not stopped.
4. `scripts/evaluate_rawframe_model.py --controlled-clip-heldout` runs against
   the new `artifacts/rawframe-model-clip-heldout/model_state.pt` and
   `training-provenance.json`, the remediated controlled clip-heldout manifests,
   and `data/manifests/negative-challenge.json`.
5. `artifacts/rawframe-model-clip-heldout/validation-report.json` and
   `artifacts/rawframe-model-clip-heldout/prediction-sidecar.json` are refreshed
   for the new checkpoint, with SHA-256 hashes recorded.
6. If `artifacts/rawframe-model-clip-heldout/calibrated-provenance.json` exists
   afterward, the session log states whether it was newly written by the
   evaluator or was absent/stale, and records its SHA-256 only when valid.
7. Controlled-pilot model/source/readiness audits are refreshed or rerun, and
   their pass/fail status is recorded without weakening gates.
8. The numbered session log records validation top-1, test top-1, macro-F1,
   negative-challenge false-pass rate, threshold, pass/fail status, artifact
   hashes, Brev worker status, final-promotion negative-challenge blocker
   separation, the manual stop command `brev stop asl-pilot-rawframe-001`, and
   one concrete next action.
9. No ONNX export, model-card promotion, final-readiness claim, final-gate
   weakening, collection capture, synthetic clips, unapproved media import, new
   source-register approval, duplicate Brev worker, Brev stop, or push occurs.

## Hard Limits

- Do not create a duplicate Brev worker.
- Do not stop the Brev worker; the user said they will stop it when done.
- Do not run browser-capture collection commands.
- Do not create, import, or commit unapproved media.
- Do not change source-register approvals.
- Do not export ONNX, promote a model card, or weaken final gates in this slice.
- Do not hand-edit `web/public/model/model-card.json`.
- Do not treat stale pre-`76b834b` validation reports or sidecars as evidence
  for the new checkpoint.
- Do not confuse the final 17-type negative-challenge gate with controlled
  clip-heldout evaluation metrics.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AA controlled clip-heldout evaluation refresh.
Completed:            <evaluation and audit-refresh evidence>.
Evidence:             <validation metrics, artifact hashes, audit statuses, Brev status>.
Remaining:            <export/promotion preflight if passed, or data/model diagnosis if failed>.
Blockers:             <none, or exact metric/audit/final-promotion blocker>.
Next step:            <one concrete next action>.
Checkpoint commit:    <commit hash>.
```
