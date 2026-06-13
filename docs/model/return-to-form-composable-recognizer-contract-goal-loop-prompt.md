# Return-To-Form Composable Recognizer Contract Goal Loop Prompt

Mission 3AS prompt for the Codex executor after Mission 3AR. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Move the loop out of repeated product-polish and into the next technical
no-spend proof toward the original plan: a composable, crop-aware raw-frame
recognizer contract that can later support fixed crops, Detector 0 crops, and a
temporal CNN/TCN-style classifier without weakening model honesty.

This is a contract/preflight mission. It may inspect code, manifests, tensors,
and retained receipts; it may add small validation/audit code if a concrete
contract gap is found. It must not launch paid compute, promote a model, export
ONNX as trained evidence, or claim browser recognition readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the Original Plan Spine and Mutable Tactical Overlay.
4. M3AR product/recovery evidence:
   - [`docs/validation/return-to-form-overnight-recovery-decision-v1.json`](../validation/return-to-form-overnight-recovery-decision-v1.json)
   - [`docs/session-logs/306-mission-3ar-overnight-recovery-decision.md`](../session-logs/306-mission-3ar-overnight-recovery-decision.md)
   - [`docs/session-logs/307-mission-3ar-validation-ledger-polish.md`](../session-logs/307-mission-3ar-validation-ledger-polish.md)
   - [`docs/session-logs/308-mission-3ar-lesson-auth-gate-smoke.md`](../session-logs/308-mission-3ar-lesson-auth-gate-smoke.md)
   - [`docs/session-logs/309-mission-3ar-practice-scope-copy-smoke-audit.md`](../session-logs/309-mission-3ar-practice-scope-copy-smoke-audit.md)
   - [`docs/session-logs/310-mission-3ar-browser-onnx-wiring-smoke-refresh.md`](../session-logs/310-mission-3ar-browser-onnx-wiring-smoke-refresh.md)
5. Reduced ASL Citizen module evidence:
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json`](../validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json)
6. PopSign / fixed-crop / Detector 0 evidence:
   - [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json)
   - [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
7. Current implementation surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`data/manifests/lesson/high-signal-module/train.json`](../../data/manifests/lesson/high-signal-module/train.json)
   - [`data/manifests/lesson/high-signal-module/validation.json`](../../data/manifests/lesson/high-signal-module/validation.json)
   - [`data/manifests/lesson/high-signal-module/test.json`](../../data/manifests/lesson/high-signal-module/test.json)
   - [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)

## Current Evidence

M3AR recovered the loop and improved local product honesty, but it selected
`continue_product_first_fail_closed_demo_polish_no_spend` only because Brev was
blocked and model evidence was weak. Four subsequent M3AR slices cleaned
validation, lesson auth-gate, practice scope-copy, and browser ONNX smoke
evidence. That is enough product housekeeping for now.

The browser model remains fail-closed. Brev remains logged out from this shell
and must not be used until human NVIDIA 2FA restores access and worker state is
inspected.

The next useful project movement is to prove what the existing code and data
can support as a composable recognizer path, not to start another broad model
retry. The executor must distinguish:

- an implemented architecture already available in
  `scripts/train_rawframe_model.py`;
- a desired original-plan architecture that is only described in docs;
- a missing contract that should be added before any training;
- a true blocker that requires Brev auth, new source approval, manual
  annotation, or human product review.

## Required Slice

Complete one smallest useful contract/preflight slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Check Brev auth once:

```sh
brev ls --json
```

If it is still logged out, record the exact EOF/2FA blocker and do not retry
login, create/delete/reset workers, or start compute.

3. Inspect the composable recognizer contract:

- List the from-scratch architectures actually implemented in
  `scripts/train_rawframe_model.py`.
- State whether a true TCN exists, whether the current
  `motion_2d_temporal_cnn` is the closest implemented temporal contract, and
  whether adding a TCN is a small local code slice or a future training
  redesign.
- Prove whether high-signal ASL Citizen tensors expose `rgb_regions`,
  `region_ids`, `rgb_frames`, and decode provenance as expected.
- Prove whether the training loader consumes `rgb_regions` as
  `rgb_regions_grid_v1` when present, or identify the exact fallback.
- Compare the current seven-label ASL Citizen reduced module against retained
  PopSign Tier 0/fixed-crop/Detector 0 evidence for the next no-spend proof.

4. Write a tracked receipt:

`docs/validation/return-to-form-composable-recognizer-contract-v1.json`

The receipt must include:

- checked commands and exit codes;
- Brev auth classification;
- selected dataset/vocabulary for the next technical proof;
- implemented architecture inventory;
- tensor-input contract evidence from sampled train/validation/test items;
- whether a true TCN is implemented, missing, or unnecessary for the next
  proof;
- explicit no-pretrained/source/no-promotion boundaries;
- exactly one next action.

5. Select exactly one next action:

- `run_capped_local_composable_smoke`: only if the contract proves existing
  data and code support a bounded no-spend local smoke with a new testable
  hypothesis.
- `add_tcn_or_multistream_contract_scaffold`: only if the highest-value gap is
  code contract/scaffold work before any training.
- `stop_for_brev_2fa`: only if the next useful action is remote worker
  inspection/training and Brev remains inaccessible.
- `stop_for_source_or_annotation_decision`: only if the next useful action
  requires new source approval or manual annotations.
- `stop_for_human_demo_review`: only if no technical no-spend proof remains
  useful and the app is already in the best honest fail-closed demo state.

## Hard Boundaries

- No paid Brev compute while `brev ls --json` is blocked by login/2FA.
- No duplicate worker, worker delete, worker reset, or unverified idle GPU
  action.
- No pretrained CV/sign/landmark/backbone/embedding/generated-label dependency
  in the promoted lane.
- No raw learner video upload.
- No source import, SemLex training use, generated pseudo-labels, or new public
  dataset training use without source-register review.
- No Detector 0/landmark training unless current evidence plus this receipt
  selects a bounded target.
- No broad 75/80/95-label run.
- No ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No push.

## Acceptance Criteria

This mission can close when:

1. Brev auth/cost-control state is checked once and classified with evidence.
2. The implemented recognizer architectures and true-TCN status are recorded.
3. Sampled high-signal train/validation/test tensor contracts are inspected and
   recorded, including whether `rgb_regions` is consumed.
4. A tracked composable-recognizer contract receipt exists and selects exactly
   one next action.
5. Any scoped code/audit changes are validated and committed.
6. The tactical overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) names this
   receipt and exactly one next action.
7. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py`,
   relevant JSON validation, and `git diff --check` exit 0 or record exact
   blockers.
8. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE if the selected next action is a bounded no-spend contract,
  scaffold, or capped local smoke with a specific hypothesis.
- REDIRECT if the receipt proves a different milestone is now the best path.
- STOP if the next action requires human 2FA, new source approval, manual
  annotation, unbounded compute, final-gate changes, or human demo review.
- ESCALATE with `openai-api-research` or `gpt-pro-research` before approving
  another speculative training-style retry when the receipt does not record a
  new, testable hypothesis.
- NUDGE if the executor repeats generic product polish, treats weak metrics as
  promotion evidence, skips tensor contract proof, or tries to revive Detector
  0/landmarks without the retained blocker context.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AS composable recognizer contract.
Completed:            <contract proof, Brev state, optional scoped fix>.
Evidence:             <receipt, commands, sampled tensors, logs>.
Remaining:            <single next action>.
Blockers:             <none or exact auth/source/annotation/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
