# Return-To-Form M3HB Human-Reopened Model Completion And Bounded Brev Goal Loop Prompt

Mission 3HB prompt for the Codex executor after Mission 3HA redirected to a
fail-closed demo finish and the supervising user corrected that decision:
continue the model/product completion push, unblock Brev, use the available
compute intentionally, research/backtrack when evidence says a route is not
working, and keep the executor/observer pair moving toward the full interactive
scratch-trained product.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one reviewable slice that advances the real requested end
state:

- browser-first ASL learning product;
- no pretrained CV/sign/landmark/model dependency in the promoted lane;
- scratch-trained detector/crop/TCN-style recognizer path when evidence
  supports it;
- human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be used as offline supervision targets for scratch-trained
  project models when provenance and rights are recorded;
- bounded Brev usage when local guards prove the run is worth paying for;
- honest fail-closed claim surfaces unless the established gates actually pass.

M3GZ and M3HA are evidence, not a ban on ML work. M3GZ says not to blindly
repeat the reduced4 ASL Citizen region-grid route: near-uniform logits,
prediction collapse, and poor held-out metrics make that path non-compute-
worthy without a new hypothesis. M3HB should choose a stronger route, repair a
specific contract that unlocks a stronger route, or improve the interactive
product while ML is blocked.

## Human Approval And Compute Envelope

The latest supervising-user instruction supersedes the M3HA fail-closed-only
decision for active work. It explicitly authorizes:

- continuing the project with the pair;
- unblocking Brev usage;
- using the available Brev/GPU budget intentionally;
- backtracking when approaches are not panning out;
- researching technical blockers;
- being deliberate about dataset and vocabulary choice;
- pushing toward the best possible interactive product.

The supervising user also clarified that landmark-annotated data is allowed.
Interpret this narrowly and usefully:

- allowed: human-authored or explicitly source-approved landmarks, boxes,
  masks, or region labels as offline supervision targets for scratch-trained
  Detector 0/crop/landmark-target models;
- still forbidden in the promoted/browser lane: MediaPipe, OpenPose, YOLO, or
  other pretrained landmark/detector runtimes; pretrained landmark feature
  caches; pretrained-generated pseudo-labels unless a later prompt explicitly
  approves them as weak supervision with provenance;
- source-register rows remain binding: a raw-video-only source stays raw-video
  only unless a separate source-review receipt updates that exact source.

This approval is bounded:

- budget context: approximately `$250` total project compute budget;
- this mission max expected additional spend: `$25`;
- price guard: do not use a worker above `$5/hour`;
- preferred worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`;
- replacement worker limit: one, only if the retained worker cannot become
  SSH/CUDA-ready and `brev search` shows an eligible option;
- non-dry-run training command limit: one;
- evaluator command limit: one;
- copyback command limit: one output directory;
- stop/default-off proof is required before the executor exits unless an
  approved remote command is still actively running and process evidence is
  recorded.

Allowed Brev command families inside this envelope:

```sh
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
brev start <selected-worker>
brev reset <selected-worker-or-id>
brev exec <selected-worker> "<bounded command>"
bash scripts/brev_sync_repo.sh <selected-worker>
brev copy <selected-worker>:<remote-output-dir> output/
brev stop <selected-worker-or-id>
```

Do not delete workers without a later explicit human instruction.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in this thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HA fail-closed redirect being superseded:
   - [`docs/validation/return-to-form-m3ha-human-review-decision-v1.json`](../validation/return-to-form-m3ha-human-review-decision-v1.json)
   - [`docs/session-logs/669-supervisor-human-review-unpark-m3ha-fail-closed-demo-finish.md`](../session-logs/669-supervisor-human-review-unpark-m3ha-fail-closed-demo-finish.md)
5. M3GZ reduced4 evidence and strategy stop:
   - [`docs/validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json`](../validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json)
   - [`artifacts/research/observer-668-m3gz-reduced4-logit-strategy/response.md`](../../artifacts/research/observer-668-m3gz-reduced4-logit-strategy/response.md)
6. Recent executable model-route evidence:
   - [`docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json`](../validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json)
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`](../validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json)
   - [`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
7. Current source, manifest, and implementation surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/*.json`
   - `data/manifests/diagnostics/popsign-label-ladder/050-labels/*.json`
   - `data/manifests/lesson/high-signal-region-grid/*.json`
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - Detector 0 scripts and receipts under `scripts/` and `docs/validation/`
8. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one smallest useful slice in this order.

1. Verify local state:

```sh
git status --short --branch
git log -16 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3ha-human-review-decision-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
brev ls --json
git diff --check
```

2. Choose exactly one route from current evidence:

- `popsign_25_or_50_bounded_brev_contract`: preferred if the PopSign 25- or
  50-label ladder has clean source/manifests and the useful blocker is only
  that the existing training guard is too tiny or tied to a spent output
  namespace. This route may patch a scoped M3HB training/evaluation guard,
  output namespace, and receipt/log. It may run Brev only after a local dry-run
  proves the exact command and output namespace.
- `detector0_crop_normalized_contract`: use if Detector 0/crop-normalized
  integration is the smallest real blocker before recognizer quality can
  improve. Human-authored or explicitly source-approved landmark, box, mask, or
  region annotations may supervise the scratch-trained Detector 0/crop target
  if the receipt records provenance and source rights. Prefer local no-spend
  static/smoke proof unless a bounded Brev smoke has a specific command and
  expected metric signal.
- `high_signal_region_grid_tcn_contract_repair`: use only if a specific
  model/input/evaluation contract bug explains M3GL/M3GZ better than weak
  model/data/input strategy. Do not rerun reduced4 or the same seven-label
  command merely with a new seed.
- `interactive_fail_closed_product_slice`: use if ML routes are blocked but a
  UI/browser/product slice can improve the app without claiming recognition.
- `research_escalation`: use if none of the above has a concrete testable
  hypothesis; save artifacts and convert the answer into a next prompt.

3. If the selected route patches code, keep the patch narrow and validate it.
   Acceptable examples:

- add one M3HB-specific output namespace guard, command flag, or caps object;
- add one local dry-run/audit for the selected training command;
- add one small Detector 0 crop-normalization contract or test;
- fix one evaluator/sidecar contract field needed by the selected route.

4. If the selected route runs Brev in this same slice, it must first prove:

- current price and worker state;
- no duplicate ASL Pilot worker is running;
- selected worker is SSH-ready and CUDA-ready;
- no active remote Python/Torch/training process is already using the GPU;
- local dry-run/check-files passed for the exact command;
- remote repo hash/freshness check passed after sync;
- remote output directory is absent before training;
- one timed training command and at most one evaluator command are used;
- output copyback, hashes, and final `brev stop`/default-off proof are recorded.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- latest human approval summary and compute envelope;
- commands run, exit codes, durations, and important output excerpts;
- route selected and rejected routes with evidence-based reasons;
- Brev state, price, selected worker, process/CUDA proof, spend estimate, and
  stop/default-off proof if any Brev lifecycle/remote command ran;
- source/manifests/labels used by the selected route;
- changed files and hashes;
- metrics/artifact hashes if training/evaluation ran;
- fail-closed claim-surface proof;
- forbidden-action proof;
- `pretrained_components: []`;
- exactly one next action.

6. Write the session log:

`docs/session-logs/671-mission-3hb-human-reopened-model-completion-bounded-brev.md`

7. Select exactly one next action:

- `continue_m3hc_bounded_popsign_brev_training_or_eval`
- `continue_m3hc_detector0_crop_normalized_contract`
- `continue_m3hc_interactive_fail_closed_product_hardening`
- `continue_m3hc_research_guided_strategy_adjustment`
- `stop_for_brev_provider_auth_or_cost_control`
- `stop_for_human_source_claim_or_submission_review`

## Hard Boundaries

- Do not push.
- Do not weaken final gates.
- Do not claim ASL correctness, browser recognition, model readiness, product
  readiness, Detector 0 runtime authority, or active vocabulary support unless
  the existing promotion/audit chain proves it.
- Do not use pretrained detectors, landmarks, backbones, embeddings, feature
  extractors, teacher logits, generated labels, or pseudo-labels in the
  promoted lane. Do not confuse that with landmark annotations: approved
  human/source-provided landmarks, boxes, masks, or region labels may be offline
  supervision targets for scratch-trained project models, but they are not
  runtime dependencies or product authority.
- Do not upload raw learner video or frames.
- Do not import new datasets/media, mutate source-register rights, or approve
  SemLex/ASL-LEX for training unless a separate source-review prompt explicitly
  authorizes it. SemLex may inform vocabulary/phonology strategy from existing
  reviewed artifacts only.
- Do not run more than one paid training command in this mission.
- Do not retry failed training by changing multiple variables at once.
- Do not delete ignored output directories just to reuse a spent namespace.
- Keep copied model outputs ignored unless a later promotion prompt explicitly
  allows tracked artifact/card changes.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HB.
2. Required baseline checks pass or exact blockers are recorded.
3. Exactly one route is selected from current evidence.
4. The selected route makes concrete progress: a scoped contract patch, a
   passing local dry-run, a bounded Brev run/eval/copyback, a Detector 0
   integration proof, an interactive fail-closed product improvement, or a
   saved research escalation with a next prompt.
5. If Brev is used, the receipt proves worker identity, price, process/CUDA
   state, sync/freshness, output absence, command count, copyback, and final
   stop/default-off state.
6. Claim surfaces remain fail-closed unless all promotion gates pass.
7. A tracked M3HB receipt and session log exist.
8. Exactly one next action is selected.

## Observer Guidance

- CONTINUE if the executor makes scoped progress, preserves claim honesty, and
  selects one bounded next action.
- NUDGE if the receipt lacks route rationale, Brev/cost proof, source/manifest
  accounting, command evidence, claim-surface proof, forbidden-action proof, or
  exactly one next action.
- REDIRECT if the executor retries reduced4 blindly, runs unbounded compute,
  changes several model variables at once, imports source/media without review,
  weakens gates, or overclaims readiness.
- ESCALATE if the next step is another training-style attempt and no concrete
  hypothesis distinguishes it from M3GL/M3GZ failures.
- STOP if Brev auth/provider/cost control, source approval, final claim,
  submission, or user-facing product scope requires human review.

## Progress Ledger

Current state: M3HA fail-closed-only steering was corrected by the supervising
user. Continue the ML/product completion push, but do it with hard evidence and
cost controls.

Completed: M3GZ logit-collapse triage; M3HA fail-closed redirect; retained
M3GL/M3GB/M3FM/M3FS evidence; pair scripts support current human Brev approval
when GOAL and prompt record it.

Remaining: pick one route that can actually reduce project risk and execute the
smallest reviewable slice toward a working interactive product.

Blockers: stop for provider/auth/cost-control, source/claim/submission review,
or if no testable hypothesis remains after research.

Next step: verify state, pick the route, and make one concrete move.
