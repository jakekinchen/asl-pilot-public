# Codex Rawframe Training Readiness Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this broad 95-label prompt unless the user explicitly
approves a redirect away from the return-to-form milestone ladder.

Mission 3 recovery prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md) first; this file scopes the next autonomous slices after the Claude loop was retired.

## Mission

Return the project to the PopSign rawframe training path. Cleanly separate first-training readiness from final model promotion: the 95-label PopSign active-recognition module is the training target, while the full 17-type negative-challenge gate remains a final-promotion/calibration requirement unless the user explicitly changes that policy.

## Source Of Truth

Authority order:

1. The user's latest instruction: use Codex for goal looping from now on.
2. [`GOAL.md`](../../GOAL.md), especially the current mission and exit condition.
3. [`DECISIONS.md`](../../DECISIONS.md): strict no-pretrained lane, Brev for heavy GPU, existing audit chain, 95-label PopSign active module.
4. [`ARCHITECTURE.md`](../../ARCHITECTURE.md): `#arch-no-pretrained`, `#arch-first-party-data`, `#arch-gpu-execution`, `#arch-active-module`, `#arch-passfail-thresholds`, `#arch-browser-export`.
5. [`docs/model/dataset-source-register.json`](dataset-source-register.json) and `data/manifests/{train,validation,test,negative-challenge}.json`.
6. Existing pipeline scripts: `scripts/audit_loop_premise.mjs`, `scripts/audit_final_manifests.py`, `scripts/decode_raw_videos.py`, `scripts/train_rawframe_model.py`, `scripts/evaluate_rawframe_model.py`, `scripts/export_onnx_model.py`, `scripts/promote_trained_model_card.mjs`.
7. Recent session logs and `docs/observer-messages/observer-log.md`.

## Intended Outcome

The repo has a clean, current, evidence-backed training-readiness state for the 95-label PopSign rawframe model. If final-promotion blockers remain, they are explicitly recorded as promotion blockers, not as a reason to continue weak online-source archaeology before any Brev training can start.

## Acceptance Criteria

All must be true before this recovery mission closes:

1. **Loop control is Codex-first.**
   - Durable docs name Codex executor + Codex observer as the active loop.
   - Claude/Happy process state is not treated as the active orchestrator.
   - Any abandoned Claude work is either committed as valid evidence or reversibly quarantined.

2. **The PopSign training path is re-centered.**
   - `GOAL.md` points at this prompt as the active per-milestone prompt.
   - The active recognition module remains the 95-label PopSign module.
   - `node scripts/audit_loop_premise.mjs --json` passes.

3. **Training-readiness blockers are classified honestly.**
   - Run `./.venv/bin/python scripts/audit_final_manifests.py`.
   - Fix purely mechanical manifest hash drift when the source-of-truth files are otherwise valid.
   - If the final 17-type negative-challenge requirement remains red, record it as a final-promotion/calibration blocker unless the audit code strictly prevents any safe training preflight.

4. **Local pre-Brev checks are current.**
   - `bash scripts/storage_budget_check.sh` passes.
   - `./.venv/bin/python scripts/audit_local_ml_environment.py --write-report docs/validation/local-ml-environment.json --report docs/validation/local-ml-environment.json` passes or records a specific environment blocker.
   - `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/train.json --manifest data/manifests/validation.json --manifest data/manifests/test.json --tensor-root data/tensors --verify-only` passes before any Brev launch handoff.

5. **Brev handoff is precise.**
   - If local preflight is clean, write a session log with the exact Brev command sequence, expected GPU, sync paths, output artifacts, and stop command.
   - Do not spend Brev money or launch a remote worker unless the user has explicitly authorized that run in the current session.

## Evidence Standard

Before claiming completion, surface:

- current `git status --short`;
- changed files and why they matter;
- active prompt path and current commit;
- manifest clip counts for train/validation/test/negative-challenge;
- exact audit commands run with pass/fail status;
- any remaining blockers classified as `training-readiness`, `Brev-human-action`, or `final-promotion`;
- the next Codex executor command or Brev handoff command.

## Decision Status

Confirmed:

- No pretrained CV/sign/landmark/model dependency may enter the promoted lane.
- Heavy final training belongs on Brev; local Mac Studio is for control-plane, smoke, decode, eval/export, and audits.
- The active recognition module is 95 PopSign labels; the 5 extra classroom items are learn-only.
- Internet Archive hand_clap / hands_cropped_out work is not training data and must not be promoted unless visual evidence is strong.

Assumptions:

- The user wants progress toward training, not more broad online-source discovery, unless a hard audit blocks all safe training preflight.
- Full 17-type negative-challenge coverage is still required before final model promotion unless explicitly changed.

Open questions:

- Whether to amend `audit_final_manifests.py` or add a separate training-preflight audit if the existing final-manifest audit intentionally blocks all training until every promotion gate is satisfied.

## Execution Rhythm

Each Codex executor turn should:

1. Run `git status --short` and read `GOAL.md` plus this prompt.
2. Run `node scripts/audit_loop_premise.mjs --json`.
3. Pick the smallest evidence-producing slice.
4. Make only scoped edits.
5. Run the relevant validation commands.
6. Write one numbered session log under `docs/session-logs/`.
7. Commit only the files for that slice.
8. Stop and report if the next step requires spending Brev money, changing a final gate, or deleting/quarantining tracked evidence.

## Progress Ledger

Use this compact block at the end of each session log:

```text
Current state:
Completed:
Evidence:
Remaining:
Blockers:
Next step:
Checkpoint commit:
```
