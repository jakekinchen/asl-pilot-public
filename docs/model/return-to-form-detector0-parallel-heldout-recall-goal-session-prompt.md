# Return-To-Form Detector 0 Parallel Held-Out Recall Goal Session Prompt

Standalone parallel Codex goal-session prompt for Detector 0. This prompt is
intentionally not the active master `GOAL.md` prompt; it exists so a separate
Codex agent can work the Detector 0 risk lane while the primary supervised
M3CK recognizer loop continues independently.

## Mission

Complete one bounded local/no-spend Detector 0 experiment that directly attacks
the held-out presence-recall failure for
`table_two_hand_union_or_contact_region`, or record the exact blocker.

The starting evidence is that the v2 union-target architecture microprobe
memorized train rows but did not fire on held-out positives:

- train presence accuracy `1.0`;
- validation presence accuracy `0.3636363744735718` with seven false
  negatives;
- test presence accuracy `0.4000000059604645` with six false negatives;
- held-out positive objectness scores were far below the fixed `0.5`
  threshold, so simple threshold promotion is not enough.

The purpose of this session is not to replace the active M3CK PopSign fresh5
architecture/input microprobe. It is to run Detector 0 as a parallel risk lane:
can we make the local scratch Detector 0 path produce credible held-out
presence signal, or do we need more supervised region rows / a different
target formulation before it can support crop normalization?

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread: run this as a
   different parallel agent goal session, not by redirecting the existing
   supervised pair.
2. `AGENTS.md` for local-skill and project constraints.
3. `GOAL.md` only for global project boundaries and to avoid conflicting with
   the active M3CK recognizer mission. Do not edit `GOAL.md`.
4. Existing Detector 0 receipts:
   - `docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`
   - `docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`
   - `docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`
   - `docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`
   - `docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`
5. Detector 0 scripts:
   - `scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py`
   - `scripts/run_return_to_form_tier0_detector0_union_target_training_smoke_continue.py`
   - `scripts/run_return_to_form_tier0_detector0_two_hand_union_training_smoke.py`
   - `scripts/run_return_to_form_tier0_detector0_training_smoke.py`
6. Approved Detector 0 packet and tier-0 tensors:
   - `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
   - `data/manifests/return-to-form-tier0/train.json`
   - `data/manifests/return-to-form-tier0/validation.json`
   - `data/manifests/return-to-form-tier0/test.json`
7. `docs/model/return-to-form-plan.md` for the return-to-form ladder.

## Parallel-Session Rules

- Do not edit `GOAL.md`.
- Do not edit the active M3CK prompt.
- Do not start, stop, resume, kill, or redirect the existing Codex supervised
  pair.
- Do not touch, stage, or commit unrelated M3CK files, including
  `scripts/run_popsign_fresh5_architecture_input_microprobe.py` if it exists as
  untracked work from another agent.
- If committing, stage only Detector 0 prompt/script/receipt/session-log files
  created or changed by this parallel session.
- If the worktree is dirty because of the other agent, continue only if your
  changes can remain clearly scoped and non-conflicting.

## Allowed Work

This session may run local CPU/MPS training-style Detector 0 diagnostics against
the already-approved 32-row packet and existing tensors. It may add or adapt a
small Detector 0 diagnostic script, write an output artifact under `output/`,
write the receipt named below, write a numbered session log, and commit the
scoped Detector 0 evidence.

Keep the experiment bounded:

- local only, no Brev;
- max three short training/configuration variants;
- no broad sweep;
- no source import, tensor mutation, manifest mutation, label expansion, or
  browser/product runtime change;
- no model export, model-card promotion, active-label promotion, final
  readiness claim, or final-gate weakening.

## Experiment Target

Directly test why v2 failed held-out presence and whether a bounded v3 change
creates real held-out signal. Good candidates include:

- separating target-cell objectness from max-map objectness;
- reducing or auditing hard-negative dominance;
- reporting threshold-free PR/AUC plus fixed-threshold behavior;
- selecting a transparent validation threshold without promoting it;
- checking whether target-cell logits rank held-out positives above negatives
  even when max-map thresholding fails;
- using a temporally safer frame choice only if already present in the packet
  or existing tensor metadata, without mutating packets/tensors;
- comparing against the train-derived median-box baseline and existing v2
  receipt.

Success does not mean product readiness. For this session, success means the
receipt can honestly classify one of these outcomes:

- a local scratch Detector 0 variant shows credible held-out positive presence
  signal without a held-out false-positive explosion;
- the current packet is too small/split-specific for Detector 0 generalization;
- the target/objectness formulation is the main deficiency;
- the next useful action is annotation/data support rather than more local
  optimization.

## Required Checks

Start with:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py scripts/run_return_to_form_tier0_detector0_union_target_training_smoke_continue.py scripts/run_return_to_form_tier0_detector0_two_hand_union_training_smoke.py scripts/run_return_to_form_tier0_detector0_training_smoke.py
```

Run `node scripts/audit_loop_premise.mjs --json` only as informational context;
do not fail this parallel Detector 0 session merely because `GOAL.md` points at
M3CK.

## Required Receipt

Write:

`docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json`

The receipt must include:

- commands run;
- files/symbols inspected and changed;
- split counts, positive counts, negative counts, signer/source distribution
  if available;
- exact experiment variants and bounds;
- train/validation/test presence metrics;
- held-out positive score distribution and held-out negative score
  distribution;
- false positives and false negatives at any fixed or selected diagnostic
  threshold;
- PR/AUC or an explicit reason it was not meaningful;
- box quality metrics separately from presence metrics;
- comparison to v2 and median baseline;
- no-Brev/no-pretrained/no-export/no-promotion/no-runtime-change proof;
- exactly one next action.

## Next-Action Choices

Choose exactly one:

- `continue_detector0_parallel_heldout_recall_microprobe`: the experiment is
  incomplete or inconclusive but still bounded and useful.
- `fix_detector0_presence_objectness_formulation_no_brev`: evidence points to
  target-cell/max-map objectness, hard-negative weighting, calibration, or
  loss/threshold formulation as the main local fix.
- `continue_detector0_annotation_or_packet_support_no_brev`: evidence says the
  current 32-row packet is too sparse or split-specific and more supervised
  region rows/review are required.
- `prepare_detector0_crop_normalization_ablation_after_heldout_presence_signal`:
  use only if held-out presence signal is credible enough to justify testing
  Detector 0 crops downstream.
- `fallback_to_fixed_geometric_regions_until_detector0_data_improves`: use if
  fixed/median regions remain more honest for crop normalization than the
  learned detector.
- `stop_for_human_detector0_scope_or_annotation_budget`: no bounded no-spend
  Detector 0 next step remains useful without a human decision.

## Acceptance Criteria

This parallel session can close when:

1. It did not edit `GOAL.md` or active M3CK prompt files.
2. It did not touch the existing supervised pair process.
3. The required receipt exists and parses as JSON, or a session log records the
   exact blocker.
4. The receipt directly addresses the held-out presence-recall deficiency.
5. The receipt records score distributions and false-positive/false-negative
   behavior, not only aggregate accuracy.
6. The receipt separates presence failure from box-regression quality.
7. No Brev/pretrained/source import/tensor mutation/manifest mutation/export/
   browser activation/model-card promotion/final claim/product runtime change
   occurred.
8. Relevant audits and py-compile checks pass or exact blockers are recorded.
9. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Progress Ledger

End the session log with:

```text
Current state:        Parallel Detector 0 held-out recall risk lane.
Completed:            <experiment result or exact blocker>.
Evidence:             <receipt, commands, metrics>.
Remaining:            <single next action>.
Blockers:             <none or exact detector/data/objectness blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
