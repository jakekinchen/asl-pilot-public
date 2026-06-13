# Return-To-Form M3HJ Detector0 Training Accuracy Spec Fit Goal Loop Prompt

Mission 3HJ prompt for the Codex executor after the supervised M3HI PopSign
raw-frame compute attempt hit a post-start SSH/sync provider blocker and the
supervising user redirected the project to Detector 0: make sure the detector is
trained, accurate, and fits the project spec.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute Detector 0
spec-fit slice. The goal is to make the next Detector 0 action obvious and
safe: prove what is already true, identify what is still missing against the
detector spec, and either implement one scoped local repair or write the exact
bounded training/evaluation receipt needed for the next mission.

This mission supersedes the currently parked M3HI PopSign 25 raw-frame compute
handoff. M3HI started the retained worker once, but sync timed out before any
remote dry-run, training, evaluator, or copyback; the worker was then stopped
and verified default-off. Do not run M3HI, do not start Brev, and do not train a
recognizer in this mission.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. Detector 0 current claim and browser surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
5. Detector 0 recent validation evidence:
   - [`docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json`](../validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json)
   - [`docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json`](../validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json)
   - [`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](../validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
6. Optional read-only side-worktree evidence, if present:
   - `/Users/kelly/Developer/asl-pilot-detector0-win`
   - recent side commits `5e810d0`, `ccffc3d`, `1c98198`, `d43a5bb`
   - side scripts named `run_return_to_form_tier0_detector0_*`
   - side receipts named `return-to-form-tier0-detector0-*`
7. Source/provenance and no-pretrained audits:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`scripts/audit_source_register.mjs`](../../scripts/audit_source_register.mjs)
   - [`scripts/audit_no_pretrained_deps.mjs`](../../scripts/audit_no_pretrained_deps.mjs)
   - [`scripts/audit_no_pretrained_artifact_json.mjs`](../../scripts/audit_no_pretrained_artifact_json.mjs)

## Current Detector 0 Reality Check

Treat these facts as current until you prove otherwise from tracked evidence:

- `web/public/model/detector0-card.json` remains fail-closed with
  `status: "not_trained"`, `promotion_state: "research_only"`, and
  `browser_artifact: null`.
- The strict-gate crop-normalization contract is diagnostic only. It is not a
  trained detector promotion, not browser recognition authority, and not final
  readiness.
- The strict-gate validation-frame 5% FPR threshold recorded `23` true
  positives, `79` false positives, `377` false negatives, `1521` true
  negatives, precision `0.22549`, recall `0.0575`, and F1 `0.0916`.
- Current learned crop usage is too low for a product detector: right-hand
  learned crop usage was about `6.07%`, with fallback used about `93.93%`.
- Side-worktree evidence may contain useful Detector 0 scripts and receipts,
  but it must not be wholesale-merged. Import only scoped, reviewed pieces that
  help this mission and keep provenance clear.

## Target Detector 0 Spec

A Detector 0 artifact can fit the project spec only when tracked evidence shows:

- scratch-trained project detector; no pretrained CV/sign/landmark/model
  dependencies, pretrained feature caches, or pretrained runtime extractors;
- approved source/provenance for all training and validation annotations;
- output targets compatible with
  `left_or_first_hand`, `right_or_second_hand`, `head_or_face`, and
  `upper_body_or_signing_space`;
- in-domain hand-visible recall at IoU `0.30` at least `0.98`;
- in-domain hand-visible recall at IoU `0.50` at least `0.90`;
- false no-hand rate at most `0.02`;
- false hand-trigger rate on no-hand/empty/low-light hard negatives at most
  `0.05`;
- temporal jitter and missing-frame behavior measured on video sequences;
- browser latency budget evidence, targeting `15-25ms` per detector frame or
  a documented every-N-frames runtime policy;
- fail-closed behavior when detector confidence or fixed-crop fallback fails;
- no raw learner video upload during normal practice.

The current strict-gate evidence fails the accuracy/coverage part of this spec.
Do not call Detector 0 trained, accurate, promoted, or product-ready unless the
above gates pass.

## Required Slice

Complete exactly one of these local slices, choosing the one that creates the
most useful next step from current evidence:

1. **Spec-fit audit/receipt:** write a tracked M3HJ receipt that compares every
   current Detector 0 evidence surface against the target spec, names the exact
   missing artifacts/metrics, and chooses the next action.
2. **Scoped side-worktree integration:** if the side worktree has a clearly
   useful Detector 0 script, receipt, contract, or audit helper that is missing
   from main, port the smallest necessary piece and test it locally.
3. **Detector training/eval command receipt:** if the code and data surfaces
   are already ready for a real Detector 0 run, write the exact bounded next
   mission receipt, including dataset manifests, artifact namespace, expected
   outputs, validation commands, Brev cap, stop/default-off procedure, and
   failure conditions. Do not start the run in M3HJ.
4. **Local Detector 0 blocker repair:** if a local contract/audit/script gap is
   blocking Detector 0 training or evaluation, fix exactly one scoped blocker
   and record proof.

## Allowed Commands

Local read-only checks, JSON validation, targeted script tests, and no-spend
audits are allowed. Brev inventory is allowed only as read-only proof that no
unexpected paid work is running.

Recommended baseline:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_strict_gate_crop_contract.mjs --json
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json >/dev/null
brev ls --json
git diff --check
```

## Forbidden Actions

Do not:

- start, stop, reset, sync, exec, or copy from Brev;
- run M3HI PopSign 25 raw-frame compute;
- train or evaluate a recognizer;
- inspect raw learner/private media;
- import or approve a new dataset without source-register evidence;
- use pretrained detectors, landmarks, feature extractors, backbones, or model
  weights in the promoted lane;
- weaken final gates;
- mutate `web/public/model/detector0-card.json` to `trained`;
- export ONNX, promote browser artifacts, activate recognition, or claim ASL
  correctness/readiness;
- wholesale merge `/Users/kelly/Developer/asl-pilot-detector0-win`.

## Required Outputs

Write:

- `docs/validation/return-to-form-m3hj-detector0-training-accuracy-spec-fit-v1.json`
- `docs/session-logs/686-mission-3hj-detector0-training-accuracy-spec-fit.md`

The receipt must include:

- current commit, active prompt, and files changed;
- commands run with exact exit statuses;
- Detector 0 card status and promotion state;
- strict-gate current metrics and whether they pass each target gate;
- side-worktree evidence reviewed, if any, with exact paths/commits;
- source/provenance/no-pretrained status;
- whether a trained Detector 0 artifact exists and whether it is usable;
- exact blocker if the detector is not trained/accurate/spec-fit;
- forbidden-action proof;
- exactly one next action.

## Next Actions

Select exactly one:

- `continue_m3hk_detector0_training_data_manifest_or_label_audit_no_brev`
- `continue_m3hk_detector0_sideworktree_integration_no_brev`
- `continue_m3hk_detector0_bounded_brev_training_receipt_no_training`
- `continue_m3hk_detector0_bounded_brev_training_run_after_human_approval`
- `continue_m3hk_detector0_browser_export_after_gate_pass`
- `stop_for_human_detector_source_or_compute_approval`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HJ.
2. No Brev lifecycle/remote command or recognizer training runs.
3. The receipt and session log exist and are valid/tracked.
4. The receipt clearly says whether Detector 0 is trained, accurate, and
   spec-fit today, with evidence for every target gate.
5. If Detector 0 is not spec-fit, the next action is concrete enough that the
   observer does not have to invent the next milestone.
6. Claim surfaces remain fail-closed and unpromoted.
7. Baseline audits pass, or exact local blockers are recorded.
8. The change is committed with a message beginning `mission-3hj:`.
