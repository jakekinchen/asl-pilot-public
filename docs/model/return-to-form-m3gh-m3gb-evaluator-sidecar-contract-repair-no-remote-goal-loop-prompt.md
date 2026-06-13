# Return-To-Form M3GH M3GB Evaluator Sidecar Contract Repair No Remote Goal Loop Prompt

Mission 3GH prompt for the Codex executor after M3GG completed the local M3GB
report/sidecar contract-gap patch plan and selected an evaluator-sidecar
contract repair.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Implement the smallest local/no-remote/no-training evaluator sidecar contract
repair justified by M3GG. The repair should make future M3GB evaluator
sidecar rows more self-contained for local root-cause analysis without
rerunning the evaluator or regenerating any copied-back outputs in this
mission.

This mission may edit only local evaluator/report contract surfaces needed for
the contract repair, the tracked receipt, and the numbered session log. The
expected primary patch surface is `scripts/evaluate_rawframe_model.py`.
Add a focused pure local static/fixture check only if it follows existing repo
patterns and does not load a checkpoint, run an evaluator, generate model
outputs, or create a parallel audit system.

It must not start or exec Brev, run training, rerun evaluation, run an
evaluator, run browser/product smoke, inspect raw videos, generate tensors or
crops, import sources, mutate source registers, mutate manifests, rewrite
copied-back outputs, export, promote, activate browser recognition, change
claim surfaces, or push.

If the repair cannot be made without running an evaluator, regenerating
outputs, adding source/crop/human-review data, using compute, changing model
architecture/input representation, or changing claim surfaces, record the
exact approval/escalation gate and select one allowed next action instead of
performing that gated work.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GG report/sidecar contract-gap plan:
   - [`docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json`](../validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json)
   - [`docs/session-logs/624-mission-3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote.md`](../session-logs/624-mission-3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote.md)
5. M3GF/M3GE/M3GD/M3GC/M3GB evidence:
   - [`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`](../validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](../validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md`](../session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md)
   - [`docs/session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md`](../session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md)
   - [`docs/session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md`](../session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md)
   - [`docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md`](../session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
6. Copied-back M3GB output JSON, if present locally:
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`
7. Existing high-signal region-grid manifests, read-only:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
8. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-remote/no-training evaluator sidecar contract repair
slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

If copied-back ignored M3GB output JSON files exist locally, validate them with
`python3 -m json.tool` and record their hashes. Do not require ignored output
files to be tracked.

2. Inspect the existing evaluator/report code path and make only the smallest
   contract repair needed for future sidecar rows to carry self-contained
   diagnostic context. Prefer adding fields from data already available to the
   evaluator or read-only manifests:

   - stable per-example row ID, split, manifest path/hash, and manifest row
     index;
   - tensor path and tensor hash from the manifest join;
   - `probability_by_label` and `true_label_probability` when already computed
     from the evaluator's current softmax output;
   - report-to-sidecar references and sidecar contract version/field inventory;
   - source/review/crop config fields already present in the read-only
     manifest, only as diagnostic metadata copied through by reference.

   Treat logits as optional diagnostic output. Include them only if doing so is
   a small local code change and the receipt clearly states they are evaluator
   diagnostics, not teacher logits, pretrained features, or claim authority.

3. Do not regenerate current M3GB sidecars or reports. Do not run
   `scripts/evaluate_rawframe_model.py`, training scripts, smoke scripts,
   browser verification, or any command that loads a checkpoint to produce
   model outputs. Validate the code change with static/local checks only, such
   as:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile scripts/evaluate_rawframe_model.py scripts/train_rawframe_model.py
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
git diff --check
```

4. Write the tracked repair receipt:

`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3GG/M3GF/M3GE/M3GD/M3GC/M3GB receipt and session paths;
- copied-back output-file presence and hashes if available;
- code surfaces inspected and changed;
- exact contract repair performed or exact blocker;
- expected future sidecar/report fields and field provenance;
- static verification results;
- approval-gated output regeneration/evaluator rerun plan, not executed;
- rejected actions and why;
- approval/escalation gates;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

5. Select exactly one next action:

- `continue_m3gb_sidecar_contract_static_validation_no_remote`
- `continue_m3gb_evaluator_output_regeneration_receipt_for_human_approval`
- `continue_detector0_or_crop_proxy_contract_after_m3gb`
- `continue_openai_or_gpt_pro_research_with_m3gb_evidence`
- `prepare_followup_compute_receipt_for_human_approval`
- `continue_fail_closed_interactive_product_hardening`
- `stop_for_human_ml_strategy_choice`

Do not select another Brev lifecycle/training/evaluation action directly. A
future evaluator rerun, output regeneration, copyback, compute step, export,
promotion, or browser activation must be only a receipt proposal requiring
fresh human approval before any lifecycle, remote, training, evaluation,
copyback, output rewrite, export, or activation command.

## Session Log

Write:

`docs/session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md`

The session log must record commands, evidence inspected, code surfaces
changed, static verification, Brev default-off status, claim surfaces, changed
files, and exactly one next action.

## Boundaries

- Local/no-remote/no-training evaluator sidecar contract repair only.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, remote
  evaluation, package install, duplicate worker, or GPU/cloud spend.
- No evaluator rerun, training/fitting, smoke/browser verification, output
  sidecar/report rewrite, output regeneration, copyback, checkpoint loading for
  generated outputs, second M3GB training attempt, broad 75/80/95-label run,
  label expansion, architecture search, hyperparameter sweep, Detector 0
  training, source/media import, source-register mutation, manifest/tensor/
  vocabulary/packet mutation, raw learner video upload, dependency-file
  mutation, generated labels, pseudo-labels, or crop/input implementation
  change.
- No raw-video inspection, crop thumbnail generation, manual relabeling, or
  source approval shortcut.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model-card promotion, ONNX export, browser recognition activation,
  threshold promotion, final-readiness claim, positive ASL-correctness claim,
  product-runtime mutation, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GH.
2. Required local checks pass or record exact blockers.
3. The M3GG, M3GF, M3GE, M3GD, M3GC, and M3GB receipts/session logs and
   available copied-back output JSON files are inspected.
4. A tracked M3GH receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt records the local code/contract surfaces inspected, the exact
   sidecar/report contract repair or blocker, field provenance, static
   validation, approval-gated future evaluator rerun/output regeneration,
   changed files, forbidden-action proof, and exactly one next action.
6. The retained worker remains stopped/default-off and no remote command
   occurs.
7. Claim surfaces remain fail-closed.
8. No forbidden training, evaluator rerun, smoke/browser verification, Brev,
   source, data, crop/input implementation, output-artifact rewrite, export,
   promotion, browser activation, or unsupported claim work occurs.
9. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training, edits
  only the scoped evaluator/report contract surfaces and evidence logs,
  validates statically, preserves fail-closed claims, records an exact blocker
  if needed, and selects one allowed next action.
- NUDGE if it misses M3GG evidence accounting, changed-code-surface
  accounting, field provenance, static verification, approval-gated output
  regeneration separation, forbidden-action proof, changed-file accounting, or
  exactly one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, evaluator reruns,
  training/evaluation, smoke/browser runs, raw-video inspection,
  source/data/crop/input mutation, copied-output rewrite, export, promotion,
  browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, training budget, or compute and no current
  strategy memo covers the exact M3GB evidence.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, output-regeneration, evaluator-rerun, or final-submission
  approval.
