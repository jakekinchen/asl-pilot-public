# DECISIONS

Status classes: locked, proposed, open, deferred, research-required.

This file is the amended round-001 decision register. Recent decisions appear
before the originally-drafted decisions; the four decisions added on 2026-05-23
remain in the round-001 section below.

---

## 2026-06-11 decisions

### decision: final pilot pipeline ships run10 for the assignment demo; run12 retained as fallback; option B not commissioned; demo-only framing locked

status: **locked** (human-directed 2026-06-11; supersedes the earlier 2026-06-11 run12 distribution-clean decision because the owner preference is to optimize the assignment demo for the strongest visible behavior, and public weight-distribution purity is not a binding constraint for this assignment)

#### recommendation

This is a noncommercial school assignment, not frontier ML. The pipeline is
**finalized** as follows; the recognizer-recipe campaign is closed.

1. **Shipped recognizer = run10 for the assignment demo.** Keep the current
   fail-closed practice-feedback demo on run10's SimCC-w48 recognizer
   (`recognizer-simccw48.onnx`; source checkpoint
   `tools/detector0-annotator/output/m3jb-recognizer-transformer-run10-simccw48-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt`)
   over the existing scratch graph (region grid -> hands2 -> SimCC w48 student
   -> 90-dim features). Run10 is the best validated artifact: recall@FAR10
   `0.9209`, top-1 `0.5428`, top-5 `0.8261`, honest monitor-fit operating
   point `0.9087` recall at realized FAR `0.088`, and near-live held-out demo
   true-accept `33/40` (`82.5%`) with wrong-prompt accept `6.1%`. Receipts:
   [`docs/validation/return-to-form-m3jb-recognizer-transformer-run10-simccw48-fulltrain-v1.json`](docs/validation/return-to-form-m3jb-recognizer-transformer-run10-simccw48-fulltrain-v1.json),
   [`docs/validation/return-to-form-m3jb-run10-trust-audit-v1.json`](docs/validation/return-to-form-m3jb-run10-trust-audit-v1.json),
   [`docs/validation/return-to-form-m3jb-run10-heldout-nearlive-eval-v1.json`](docs/validation/return-to-form-m3jb-run10-heldout-nearlive-eval-v1.json),
   [`docs/validation/return-to-form-m3jb-run10-prod-deploy-v1.json`](docs/validation/return-to-form-m3jb-run10-prod-deploy-v1.json).
2. **Run12 is retained as the rights-clean fallback / ablation, not the
   assignment-demo artifact.** Run12 clears the MVP gate with recall@FAR10
   `0.8848`, all 95 classes intact, and zero ASL-Citizen recognizer-training
   rows. It proves the accuracy cost of removing AC recognizer data is modest
   (`-3.6` recall@FAR10 points, `-8.3` top-1 points), but the assignment demo
   should not take that quality hit unless a later public-distribution
   constraint becomes binding. Receipt:
   [`docs/validation/return-to-form-m3jb-run12-popsignonly-v1.json`](docs/validation/return-to-form-m3jb-run12-popsignonly-v1.json).
3. **Option B (fully PopSign-only end-to-end) is NOT commissioned.** No SimCC
   student retrain, no re-extraction, no further recognizer training, no
   further Brev spend for this. The shipped graph makes **no "AC-free"
   claim**; instead the SimCC student's geometry-level ASL-Citizen influence
   (38.8% of its training frames; coordinates only, never sign labels) is a
   **documented disclosure** in the demo and model docs, under noncommercial
   academic research use.
4. **Demo-only framing is locked.** No model-card promotion and no new claim
   lane: `web/public/model/model-card.json` stays `not_trained`,
   `docs/model/active-vocabulary-claim.json` stays `activeLabels: []`.
   User-facing copy says **"practice feedback"** — never "grading",
   "assessment", or "ASL correctness".
5. **Thresholds:** the deployed accept threshold must be monitor/validation-fit
   from run10 (per the run10 trust-audit `check_5` pattern); test-fit
   thresholds are diagnostic only.

#### rationale

- The owner preference is explicit: for this assignment, public distribution of
  the weights is not the binding constraint, and run10 is the desired demo
  artifact. The project should therefore optimize for the strongest visible
  behavior under honest demo-only labeling.
- Run10 has the stronger evidence stack: exact reproduction from weights+cache,
  signer-disjoint PopSign test splits, a monitor-fit threshold transfer audit,
  a browser-pipeline near-live held-out eval, and a production deploy receipt as
  a fail-closed practice-feedback demo.
- Run12's rights-cleaner value is real, but it trades away `3.6` recall@FAR10
  points and `8.3` top-1 points to solve a distribution axis the assignment
  does not bind on. It belongs in the writeup as fallback / ablation evidence,
  not as the active assignment-demo swap.
- Option B costs another Brev cycle plus a full re-extraction and carries real
  gate-regression risk (dropping 38.8% of the student's training frames could
  push landmark PCK, and therefore recall, below `0.85`), to upgrade a claim the
  project does not need. ASL Citizen's noncommercial terms permit the assignment
  use; honest disclosure beats spending compute to chase a stronger claim
  (LESSONS.md#84 pattern: don't spend on an axis the product doesn't bind on).
- Demo-only framing matches the evidence: near-live browser eval showed
  `82.5%` demo true-accept on run10; that supports "practice feedback", not
  assessment authority. Building claim-lane machinery for a school deliverable
  is over-engineering.

#### implications

- Remaining engineering (loop slices, local, fail-closed): preserve and verify
  the existing run10 browser ONNX + threshold sidecar; ensure the deployed
  threshold sidecar is monitor/validation-fit, not test-fit; run JS<->Python
  parity if any run10 graph or threshold artifact is touched; record the
  repeated-use `/practice` browser lifecycle proof; redeploy only if needed
  under the same labeled-demo boundary as the existing run10 deploy.
- The recognizer-distill campaign and the landmark-PCK campaign stay closed;
  no new training runs without a new human directive.
- The final writeup cites run10 as the chosen assignment-demo artifact and
  run12 as the fallback / ablation that quantifies the accuracy cost of removing
  AC recognizer-training rows, with the disclosure sentence for the SimCC
  student.

#### revisit trigger

Only if the project ever needs a true "zero AC derivation anywhere in the
shipped graph" claim (e.g., public release beyond the academic pilot) does
option B become worth commissioning. If a later owner directive makes public
weight-distribution constraints binding, run12 is the first fallback before B.

#### anchors

[`#arch-no-pretrained`](ARCHITECTURE.md#arch-no-pretrained),
[`#arch-downscope-ladder`](ARCHITECTURE.md#arch-downscope-ladder)

---

## 2026-06-02 decisions

### decision: distinct left/right handedness is not a demo gate; two non-collapsed hand boxes is the binding two-hand requirement

status: **locked** (human-authorized 2026-06-02, Mission 3JB)

#### recommendation

The browser demo does not require distinct anatomical left/right (or
first/second) hand *identity*. The binding two-hand requirement is that two
visible hands yield two distinct, non-collapsed boxes — no sustained dual-track
collapse onto one physical hand. The old `>= 0.98` distinct-L/R-assignment
acceptance gate is therefore **descoped for the demo**: it is satisfied in
substance by collapse `0.000` + two distinct decoded boxes + coverage `0.988`
(local heuristic + deterministic post-filters, no training, no Brev), and the
residual `0.976` distinct-assignment number is not a blocker.

#### rationale

- The current active recognizer / practice pass-fail path does not consume L/R
  hand identity. Audit `browser_product_gate_requirement_answered` in
  `scripts/audit_m3jb_hand_state_tracker.mjs` derives this from the code:
  `distinct_lr_assignment_required_by_current_active_recognizer === false`.
- 8+ trained selectors and multiple uncapped full-scope Brev runs plateaued at
  0.43-0.69 distinct assignment; the cheap local heuristic + deterministic
  post-filters reached 0.976 (within ~1 frame). Further compute on this number
  is the lowest-leverage move.
- User confirmation (2026-06-02): "handedness doesn't really matter for our
  demo."

#### implications

- The loop stops chasing the remaining 1-2 distinct-assignment rows. The
  two-hand box stage is demo-complete.
- M3JB advances down the hierarchy to the next demo-visible bottleneck: landmark
  / per-hand-crop quality, then temporal track stability and browser parity.
- No-collapse and "two distinct boxes" remain hard requirements; only anatomical
  L/R identity is descoped.
- Browser runtime stays fail-closed until the remaining landmark/tracking gates
  pass.

#### revisit trigger

If a future recognizer or product surface begins consuming anatomical L/R
identity, re-open this and restore the distinct-assignment gate.

---

## 2026-05-30 decisions

### decision: offline-derived labels are allowed only as supervision; runtime remains scratch-only

status: **locked** (human-authorized 2026-05-30, Mission 3IQ)

#### recommendation

Permit Detector 0 training and evaluation labels to be derived offline by an
approved tool when the source rights, provenance, partitions, and receipts are
recorded, while keeping the deployed browser/runtime lane free of pretrained
detectors, landmarkers, feature extractors, backbones, weights, and shipped tool
dependencies. Any project artifact that names the label provenance must use
co-located wording like: "targets offline-derived via MediaPipe Holistic; runtime uses only our scratch-trained model and is not a runtime dependency."

#### rationale

The supervising user authorized this label/runtime separation on 2026-05-30.
The immediate trigger was the supervisor-owned side worktree
`/Users/kelly/Developer/asl-pilot-annotator` on branch `annotator-tool`, which
proved a from-scratch region + hand-landmark Detector 0 path on 18,189 PopSign
frames across 95 words without changing the loop branch or browser runtime.

Read-only evidence from that worktree:

- `/Users/kelly/Developer/asl-pilot-annotator/research/detector0-trained-evidence.md`
  (SHA-256 `34bc2ade24badd1ddfeb79f0377b88b40b1853052b189c268bf2e675a89d47ef`)
  records held-out region-detector metrics: head/face recall@IoU0.30 `0.984`,
  signing-space `0.999`, left hand `0.880`, right hand `0.782`, and learned hand
  IoU about `0.51`.
- `/Users/kelly/Developer/asl-pilot-annotator/research/detector0-hand-push-findings.md`
  (SHA-256 `f36dba70464bf6e06a8f2479d8ca32e912b99338643be21fdd2fefba00c4ffdd`)
  records that hand-box precision is label-quality-capped near `0.55` IoU, so
  further hand-spec progress belongs to better labels or a different landmark
  head rather than silent product promotion.
- `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-spec-eval.json`
  (SHA-256 `66810d0e1c21b832a22ec1f20a0f38fd66e5abdaa11f5929a721513ba65077d9`)
  records the per-target held-out recall and IoU values used above.
- `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-hand-landmarks.json`
  (SHA-256 `47c61deeeb37b6ec497c172cce0775b7adb213b0184183a6a31c65b54b262977`)
  records the first scratch hand-landmark baseline, with hand PCK@0.10 `0.2992`.

This decision does not approve a runtime dependency, a trained browser artifact,
ASL correctness claims, source-rights shortcuts, or final-gate changes. It only
permits honest offline-label supervision when the runtime boundary is stated in
the same disclosure string.

#### implications

- `scripts/audit_no_pretrained_artifact_json.mjs` permits only a single-string
  provenance disclosure that also attests the runtime model is scratch-trained;
  bare pretrained references, `pretrained_components`, `extractor`,
  `tasks_vision_version`, dependency entries, and browser-artifact paths remain
  banned.
- The loop branch must not import or run the offline labeler, re-run labeling or
  training, promote artifacts, export ONNX, activate browser recognition, or
  mutate model cards to trained as part of this decision.
- Claim surfaces remain fail-closed until the normal promotion gates pass:
  `web/public/model/detector0-card.json` stays `status: "not_trained"` /
  `promotion_state: "research_only"` / `browser_artifact: null`, and active
  recognition labels remain empty unless a later validated promotion changes
  them.
- Existing raw-video-only source approvals remain raw-video-only unless a later
  source-review receipt explicitly updates the exact source and derived-label
  permission.
- The next loop-owned integration slice should define the Detector 0 target
  contract or update the fail-closed Detector 0 card using this disclosure
  boundary.

#### revisit trigger

Revisit only if the project sponsor changes the runtime no-pretrained rule,
source rights disallow derived labels for an intended training set, or a future
promotion proposal asks to ship any non-scratch runtime component.

---

## round-001 decisions (locked 2026-05-23)

### decision: strict no-pretrained promoted lane; Stage A is vestige

status: **locked** (round 001)

#### recommendation

Adopt the plan's `#arch-no-pretrained` invariant strictly. The previous Stage A demo (DTW templates over MediaPipe Hand Landmarker normalized landmarks) is a **vestige** and is removed by [`task-026`](MVP_TASKS.md#task-026). After removal, the promoted recognition path uses random-init scratch weights only. No MediaPipe, OpenPose, YOLO, ResNet, EfficientNet, ViT, CLIP, SAM, DINO, MMPose, MMDet, `from_pretrained`, `torch.hub`, pretrained `timm`, or pretrained `weights=` loads — anywhere in the active path.

#### rationale

The original demo lane was an honestly-disclosed academic shortcut taken while no first-party raw-video dataset existed. With the plan now committing to the strict invariant and with the raw-frame DNN scaffolding already in place, keeping Stage A as a parallel lane would only blur the promotion claim. Per `docs/strategy-confidence-audit.md` hard gate "From-scratch provenance overclaim", the final pilot artifact must bind to random-initialization provenance — Stage A cannot satisfy that.

#### implications

- All MediaPipe assets, code paths, and landmark-cached training data are removed from the repo by `task-026`.
- The promoted candidate is the rawframe lane: [`scripts/train_rawframe_model.py`](scripts/train_rawframe_model.py) + [`artifacts/rawframe-model/`](artifacts/rawframe-model/) + [`web/public/model/asl-pilot-rawframe-v0.onnx`](web/public/model/), aliased in plan terms as `GuidedCropSignNet`.
- `docs/validation/no-pretrained-lane-audit.json` becomes a required artifact after Stage A removal.
- [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs) must be tightened so any new `extractor: { name: "mediapipe_*" }` field fails the audit (today it passes because the disclosed boundary was allowed).
- The `not_trained` state of the current model card is the honest state until a first-party-data Brev training round completes.

#### revisit trigger

Only if the project sponsor changes the no-pretrained requirement in writing.

---

### decision: Brev for heavy GPU; local Mac Studio MPS for light work

status: **locked** (round 001)

#### recommendation

- **Heavy GPU training** (full rawframe training runs, multi-epoch promoted-candidate training, ablation studies, HandBoxNet detector training, hard-negative training) → **Brev remote GPU workers**.
- **Light work** (smoke runs, dataloader checks, evaluation, ONNX export, browser smoke harnesses, all audit chain runs, calibration, hard-negative scoring) → **local Mac Studio (Apple MPS, PyTorch 2.12.0)**.
- Local machine remains the storage/cache/control plane: repo, audits, data shards, artifact collection.
- Stop Brev workers aggressively after artifact collection (`scripts/brev_stop_all_training.sh`).

#### rationale

The team has been operating on local MPS, and the existing environment receipt [`docs/validation/local-ml-environment.json`](docs/validation/local-ml-environment.json) is bound into completion-readiness audits per `docs/strategy-confidence-audit.md` hard gate "Local GPU/open-source environment drift". MPS is sufficient for smoke/eval/export but not for full training runs at first-party data scale. Brev's the right escape hatch for the heavy work.

#### implications

- `scripts/brev_create_48h.sh`, `scripts/brev_sync_repo.sh`, `scripts/brev_stop_all_training.sh` are authored in [`task-006`](MVP_TASKS.md#task-006).
- The training-run manifest must record MPS-or-Brev-GPU execution (per the same hard gate); CPU fallback is rejected.
- `BrevShardManifest` and `BrevRunManifest` join the cross-doc invariants table.
- Local audit runs do not require Brev; they remain on MPS.

#### revisit trigger

Brev capacity/cost issues, or sponsor approves an alternate GPU provider.

---

### decision: harmonize with existing audit chain; no parallel system

status: **locked** (round 001)

#### recommendation

Wire all plan validation entries to the repo's existing `node scripts/audit_*.mjs` / `python scripts/*.py` chain. Do not introduce `npm test`-style validations as a parallel system. Do not author `scripts/check_project_ready.mjs` — [`scripts/audit_completion_readiness.mjs`](scripts/audit_completion_readiness.mjs) already plays that role.

#### rationale

The repo has 200+ existing audit scripts and a 95+ hard-gate framework in [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md). Parallel systems create drift and undermine the hash-pinning chain. Per the plan's own [`docs/repo-integration-reconciliation.md`](docs/repo-integration-reconciliation.md): *"Do not create duplicate validation systems if the repo already has audit surfaces. Adapt `docs/validation/*` names to existing conventions and record the mapping."*

#### implications

- [`MVP_TASKS.md`](MVP_TASKS.md) validation commands replaced `npm test -- progress` etc. with concrete `node scripts/audit_*.mjs` invocations.
- Unit tests where genuinely needed (e.g. `PassFailDecision` boundary cases in `task-017`) extend the existing browser-onnx smoke instead of adding Vitest as a new top-level runner.
- Playwright is already installed; camera-state specs will be added under `task-016` continuing the existing tool choice.
- `docs/validation/no-pretrained-lane-audit.json` (new artifact) is generated by extending the existing no-pretrained audits, not by a separate tool.
- Plan's `docs/validation/handboxnet_v0_report.json`, `baseline_10sign_report.json`, `guided_crop_signnet_v1_report.json` names are reserved for use only if the rawframe lane actually produces these reports; until then the repo's existing report names are canonical.

#### revisit trigger

Only if a class of validation cannot be expressed in the existing chain (none identified so far).

---

### decision: Codex executor + Codex observer + commit-on-completion

status: **locked** (round 001, amended 2026-05-25 for Codex-only loop)

#### recommendation

Adopt a two-role Codex autonomous workflow:

- **Executor = Codex** (dedicated Codex session, started by [`scripts/start_codex_goal_loop.sh`](scripts/start_codex_goal_loop.sh)). Each turn: reads [`GOAL.md`](GOAL.md) + active per-milestone prompt, executes one reviewable slice, runs validation, writes a session log, and **commits locally**.
- **Observer = Codex** (separate Codex session, also startable by [`scripts/start_codex_goal_loop.sh`](scripts/start_codex_goal_loop.sh)). Each pass: reads [`docs/observer-prompt.md`](docs/observer-prompt.md) + source-of-truth chain, decides among CONTINUE / NUDGE / REDIRECT / STOP / ESCALATE, and acts per the decision tree.

**Coordination is file-based**:

- Observer writes `docs/observer-messages/NNN-nudge-*.md` and appends to `docs/observer-messages/observer-log.md`.
- Executor reads both at the start of every turn. Un-acked nudges >3 turns escalate to REDIRECT (observer edits a durable goal file).
- Big redirects: observer edits `GOAL.md` or the active per-milestone prompt directly; executor picks up the change on its next turn.

**Commit cadence is a hard rule:** every completed slice = one local commit, following the heredoc template in [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md). Never `--no-verify`, never `--amend`, never `git add -A`, never push without explicit human go.

The executor writes its session ID to `.codex-executor-session-id` at repo root (gitignored); observer uses `.codex-observer-session-id`.

Claude/Happy is no longer the active executor. Do not restart Claude for this repo unless the user explicitly re-enables that path.

#### rationale

The team's existing convention already used `GOAL.md` + `docs/model/*-goal-loop-prompt.md` as durable goal-loop prompts. This decision keeps that convention but removes the Claude/Happy process layer that accumulated stale tabs and long-context drift.

Hard commit cadence is what keeps the autonomous workflow safe: if the loop crashes or drifts, recent reviewable commits are the recovery surface. No commit = nothing to recover from and nothing to review.

#### implications

- [`GOAL.md`](GOAL.md) is the active master goal-loop prompt at repo root.
- [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md) defines the Codex executor/observer protocol.
- [`docs/runbooks/codex-goal-loop.md`](docs/runbooks/codex-goal-loop.md) and [`scripts/start_codex_goal_loop.sh`](scripts/start_codex_goal_loop.sh) are the active start surfaces.
- Legacy Claude slash commands remain historical tooling but are not the active loop.
- Universal acceptance criteria in [`MVP_TASKS.md`](MVP_TASKS.md) include the commit step.
- `.codex-executor-session-id` and `.codex-observer-session-id` are gitignored so the pair can resume stable threads without polluting the tree.
- Default harness recommendation: `bash scripts/start_codex_goal_loop.sh --role both`.

#### revisit trigger

If the autonomous workflow produces noisy or unreviewable commits, or if the observer cadence proves wrong, tune the cadence and template; do not abandon the pattern.

---

### decision: plan files merged into repo round 001

status: **locked** (round 001)

#### recommendation

The plan folder's durable files have been merged into the repo this round, amended where they conflicted with reality. Specifically:

- [`ARCHITECTURE.md`](ARCHITECTURE.md), [`MVP_TASKS.md`](MVP_TASKS.md), [`DECISIONS.md`](DECISIONS.md), [`STAGE_GATE_STATUS.md`](STAGE_GATE_STATUS.md), [`CLAUDE.md`](CLAUDE.md), [`CLAUDE_CODE_HANDOFF.md`](CLAUDE_CODE_HANDOFF.md) — amended for repo reality and Stage A vestige policy.
- [`PRESEARCH.md`](PRESEARCH.md), [`RESEARCH.md`](RESEARCH.md), [`DIAGRAM_PLAN.md`](DIAGRAM_PLAN.md), [`FILE_MANIFEST.md`](FILE_MANIFEST.md) — copied verbatim from plan.
- [`.claude/commands/`](.claude/commands/) — 13 slash commands installed.
- [`configs/`](configs/) — 8 example/config files seeded; not yet bound to a trained model.
- Area scaffolding: [`web/CLAUDE.md`](web/CLAUDE.md), [`web/LESSONS.md`](web/LESSONS.md), [`scripts/CLAUDE.md`](scripts/CLAUDE.md), [`scripts/LESSONS.md`](scripts/LESSONS.md), [`data/CLAUDE.md`](data/CLAUDE.md), [`data/LESSONS.md`](data/LESSONS.md), [`docs/CLAUDE.md`](docs/CLAUDE.md), [`docs/LESSONS.md`](docs/LESSONS.md), [`infra/CLAUDE.md`](infra/CLAUDE.md), [`infra/LESSONS.md`](infra/LESSONS.md), [`models/CLAUDE.md`](models/CLAUDE.md), [`models/LESSONS.md`](models/LESSONS.md), [`product/CLAUDE.md`](product/CLAUDE.md), [`product/LESSONS.md`](product/LESSONS.md).
- Plan-template READMEs landed in `docs/model-plan-templates/`, `docs/research-plan-templates/`, `docs/validation-plan-templates/` so they do not clobber the repo's existing 254-file `docs/validation/` etc.
- Plan-supplied docs (`docs/48h-execution-playbook.md`, `docs/acceptance-matrix.md`, `docs/browser-runtime-contract.md`, `docs/capture-protocol.md`, `docs/database-schema.md`, `docs/dataset-card-template.md`, `docs/deployment-readiness.md`, `docs/hint-authoring-guide.md`, `docs/model-card-template.md`, `docs/no-pretrained-audit.md`, `docs/orchestrator-briefing.md`, `docs/privacy-video-handling.md`, `docs/repo-integration-reconciliation.md`, `docs/tdd-brief-template.md`, `docs/team-lead-handoff.md`, `docs/team-protocol.md`, `docs/validation-report-template.md`, `docs/vocabulary-plan.md`) — copied as-is; they complement, not replace, the repo's existing `docs/` chain.
- First JIT brief: [`docs/briefs/001-stage-a-vestige-removal.md`](docs/briefs/001-stage-a-vestige-removal.md).

#### rationale

Per [`docs/repo-integration-reconciliation.md`](docs/repo-integration-reconciliation.md): "If existing repo conventions conflict with this plan, update this plan's durable files rather than overriding working code silently." The plan's invariants and the repo's reality were reconciled before merge, not after.

#### implications

- Existing repo files were not modified in this round (with the deliberate exception of writing new top-level plan files). No `git rm` was performed; the actual Stage A vestige removal happens in `task-026` under its own brief and is recommended to spawn into a separate session/worktree to keep that change reviewable.
- The plan's `H0–H48` window framing is replaced by the repo's actual multi-week cadence (see [`#arch-downscope-ladder`](ARCHITECTURE.md#arch-downscope-ladder)).

#### revisit trigger

Only when the plan needs another full reconciliation round.

---

## 2026-05-24 decisions

### decision: 95-label PopSign-v1 is the active recognition module; 5 classroom items are learn-only

status: **locked** (2026-05-24)

#### recommendation

The **active recognition module** that the promoted rawframe model recognizes is the **95-label PopSign-v1 vocabulary**, bound through the source-register decision `approved_popsign_v1_original_videos_2026_05_20` (`allowed_for_model_training: true`). The **content vocabulary** rendered in [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) is 100 items: the 95 PopSign labels plus 5 classroom-category items (`help`, `stop`, `finish`, `school`, `plus`). The 5 classroom items are `learn_only_labels` — they appear in the practice surface but are NOT recognition-module classes; no CV claim is made for them.

#### rationale

The active-vs-content split is the named pattern in the round-001 ["75–100 content items vs active recognition module"](#decision-75100-content-items-vs-active-recognition-module) decision. The specific 95/5 instantiation was decided on 2026-05-24 after the M5a snapshot-evidence slice ([`docs/session-logs/044-mission-5a-active-module-snapshot-evidence.md`](docs/session-logs/044-mission-5a-active-module-snapshot-evidence.md)) resolved the `audit_final_manifests.py` first-failure blocker that the M4a postmortem ([`docs/session-logs/041-postmortem-first-party-misread.md`](docs/session-logs/041-postmortem-first-party-misread.md)) carry-forward had surfaced.

The 95-label PopSign module satisfies the 75–100 label promotion gate (round-001 promotion-readiness gate) without requiring CV evidence for the 5 classroom items, which would be unfounded.

#### implications

- Trained-surface artifacts (`artifacts/rawframe-model/`, `web/public/model/asl-pilot-rawframe-v0.onnx`, model-card `recognized_labels`, `docs/model/active-vocabulary-claim.json`) bind to the **95-label active recognition module** only.
- UI surfaces must mark the 5 classroom items (`help`, `stop`, `finish`, `school`, `plus`) as `learn_only_labels` and must not pass them to the recognizer as expected classes.
- The active-module snapshot evidence at [`data/active-module/vocabulary-active-module.snapshot.json`](data/active-module/vocabulary-active-module.snapshot.json) (SHA `25a0c937e3900037da8650b882e44c6281c347abf3e4b2b338ed6dcf21c72e8d`) and [`data/active-module/active-module-vocabulary-review.json`](data/active-module/active-module-vocabulary-review.json) (SHA `7bc269d45a26b9b36cd111587e66663d57f5683626500b889c2b029725968481`) are the frozen 95-item evidence the final manifests bind to via `vocabulary_review.evidence.path` / `vocabulary_review.evidence.sha256`.
- [`scripts/build_active_module_snapshot.mjs`](scripts/build_active_module_snapshot.mjs) is the deterministic builder for the snapshot pair. Do not hand-edit the snapshot files.
- Any future change to the active recognition module (e.g., switching to first-party-browser-consent-capture per the source-register's other approved-for-training source) is a deliberate redirect that re-runs the snapshot builder and amends this row.
- This decision row satisfies [`GOAL.md`](GOAL.md) Mission 3 exit-condition item 2.

#### revisit trigger

Switching the active recognition module to a different label set or evidence source (e.g., first-party-browser-consent-capture clips replacing PopSign-v1 raw videos). At that point, re-run [`scripts/build_active_module_snapshot.mjs`](scripts/build_active_module_snapshot.mjs) and amend this row.

#### anchor

[`#arch-active-module`](ARCHITECTURE.md#arch-active-module)

---

## original decisions (carried forward, amended where noted)

### decision: ASL-only isolated vocabulary pilot

status: **locked**

#### recommendation

Support American Sign Language only, with isolated beginner vocabulary signs only.

#### rationale

The pilot explicitly excludes other signed languages, sentence recognition, phrase translation, and open-ended conversation recognition.

#### implications

- Vocabulary item is the primary content unit.
- No conversational translation UI.
- No BSL/multilingual sign abstractions in v0.
- Enforced by [`scripts/audit_scope_boundaries.mjs`](scripts/audit_scope_boundaries.mjs).

#### revisit trigger

Only revisit after pilot acceptance.

---

### decision: 75–100 content items vs active recognition module

status: **locked**

#### recommendation

Ship 75–100 beginner vocabulary prompts/content items, but explicitly gate recognition to the validated active model module. The UI must label unsupported or content-only signs honestly.

#### rationale

The write-up requires 75–100 vocabulary items, but full validation of 75–100 recognition classes requires substantial first-party data and training time. The active-module design preserves honesty while still supporting the content requirement.

#### implications

- The 100 content items are already implemented in [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts).
- [`configs/active-sign-modules.example.json`](configs/active-sign-modules.example.json) seeds the active-module declaration; it must be re-authored to point at the rawframe lane after `task-026`.
- `docs/model/active-vocabulary-claim.json` becomes a required final artifact.

#### revisit trigger

If training/validation proves 75–100 signs under controlled conditions, promote the larger module (see [`task-024`](MVP_TASKS.md#task-024)).

---

### decision: no pretrained models in promoted lane

status: **locked** — see round-001 strict-no-pretrained decision above for the operative formulation. This entry is preserved for traceability.

---

### decision: browser-first inference and local video processing

status: **locked**

#### recommendation

Run recognition in the browser during normal practice. Do not upload raw learner video by default.

#### rationale

Browser-first inference and privacy-conscious video handling are required by the project brief.

#### implications

- ONNX Runtime Web is the browser runtime (existing: `onnxruntime-web@^1.26.0` + same-origin WASM via [`web/src/app/api/ort/[file]/route.ts`](web/src/app/api/ort/)).
- Progress storage stores metadata/outcomes, not raw frames (existing: enforced by [`scripts/audit_no_raw_video_upload.mjs`](scripts/audit_no_raw_video_upload.mjs)).
- Future data collection requires explicit consent and is gated behind `ENABLE_DATASET_COLLECTION=true` env vars.

#### revisit trigger

Only a future consented research collection feature may alter this default.

---

### decision: pass/fail thresholds and abstention

status: **locked**

#### recommendation

Never mark uncertain predictions as correct. Use top-1 confidence, margin, entropy/quality gates, active-module membership, and hard-negative/open-set checks before passing.

#### rationale

Per project brief and `docs/strategy-confidence-audit.md` hard gates "Calibrated fail-closed thresholds" and "Negative challenge rejection".

#### implications

- Plain argmax cannot be the product decision.
- `PassFailDecision` must carry reasons.
- Hints can be based on fail reasons and sign metadata.
- Calibration evidence: [`scripts/analyze_controlled_pilot_thresholds.mjs`](scripts/analyze_controlled_pilot_thresholds.mjs), [`scripts/analyze_controlled_pilot_reject_score_grid.mjs`](scripts/analyze_controlled_pilot_reject_score_grid.mjs).
- Hard-negative coverage: [`data/guardrail-negative-fixtures/`](data/guardrail-negative-fixtures/), [`scripts/audit_guardrail_negative_fixtures.mjs`](scripts/audit_guardrail_negative_fixtures.mjs); target FAR < 0.05.

#### revisit trigger

Thresholds may be tuned from validation evidence, but the abstention principle remains locked.

---

### decision: targeted hints are rule-based in v0

status: **locked**

#### recommendation

Build a deterministic hint engine using sign metadata, camera quality checks, active module confusion pairs, and generic retry guidance. Do not require live phonology diagnosis for v0.

#### rationale

The pilot allows rule-based hints, and `docs/strategy-confidence-audit.md` hard gate "Honest targeted hints" forbids fake diagnostic precision.

#### implications

- Every vocabulary item needs hint metadata — currently a GAP (see [`task-018`](MVP_TASKS.md#task-018)).
- Hints must name teachable aspects: handshape, movement, location, orientation, timing, or framing — but only when actually observable.
- Reviewer authority chain via [`scripts/audit_hint_pedagogy_review.mjs`](scripts/audit_hint_pedagogy_review.mjs) gates hint copy.

#### revisit trigger

If model heads/phonology metadata are validated, add more specific hints.

---

### decision: account and progress adapter

status: **locked** (was proposed; now locked given repo state)

#### recommendation

Continue using the existing Supabase Auth + Postgres implementation. No `AuthRepository` / `ProgressRepository` refactor is required this round.

#### rationale

Refactoring an already-working auth layer for purity gains is low ROI given the rest of the round 001 backlog.

#### implications

- [`docs/database-schema.md`](docs/database-schema.md) reflects the actual `profiles` + `attempts` + `attempt_progress` shape (plan's expected `vocabulary_items` / `practice_sessions` / `mastery_states` additions are tracked as [`task-015a`](MVP_TASKS.md#task-015a) and [`task-015b`](MVP_TASKS.md#task-015b)).
- RLS policies in [`supabase/migrations/`](supabase/migrations/) enforce per-user isolation.

#### revisit trigger

If we need to swap auth providers (no current plan).

---

### decision: model architecture path

status: **locked** (was proposed; now locked given Stage A vestige decision)

#### recommendation

Train the smallest fixed-crop / upper-body learnability proof first: a 5-sign
Tier 0 set with source coverage, fixed crop config, and validation gates
committed before training. The rawframe pipeline remains the current
implementation entrypoint, aliased to plan's `GuidedCropSignNet`, but it must
not be relaunched as a broad 75/95-label run until Tier 0 and then Tier 1 show
real learning. Build HandBoxNet only after the fixed-crop proof exists or after
a crop-quality-bounded failure is recorded. Heavy training runs on Brev;
smoke/eval/export stays on local MPS where feasible.

#### rationale

The broad rawframe pipeline has produced good provenance but weak learning when
run directly at 95 labels. The more predictable path is to prove separability
and crop discipline on a small controlled set before scaling. HandBoxNet is an
optimization, not a prerequisite.

#### implications

- `task-010` now starts with 5-sign Tier 0 source/coverage, crop config, and
  gate artifacts before training.
- `task-009` (HandBoxNet) is deferred until fixed-crop proof exists or fixed
  crops are proven to be the blocker.
- `task-011` (`GuidedCropSignNet`) is aliased to the rawframe entrypoint but
  remains gated by the downscope ladder.

#### revisit trigger

If Tier 0 cannot learn despite clean data/crops, stop and reconsider the claim.
If Tier 0 learns but crop quality limits user robustness, queue HandBoxNet as a
detector ablation.

---

### decision: Brev-only GPU execution

status: **superseded** — see round-001 "Brev for heavy GPU; local MPS for light work" decision above.

---

## open decisions

1. Exact threshold targets acceptable to sponsor for the active module.
2. Whether trained weights may be redistributed or only used privately for the pilot.
3. Final deployment target (Vercel default; alternatives if pilot reviewers need otherwise).
4. Final selected vocabulary after first-party collection audit (which signs actually collected enough clips to meet the per-split signer + ≥5 clips/split bar).
5. **Push-blocker resolution (HUMAN-DRIVEN).** Four pre-existing blobs in unpushed history exceed GitHub's 100 MB per-file limit: `artifacts/stage_b/supervision_75label_teacher_replace_read_all_please_grandma_v0/supervision.jsonl` (294 MB), `data/external/primarymath-classroom-asl-118/{train,val,test}.hdf5` (1.6 GB + 339 MB + 365 MB). All four are deprecated alongside Stage A / the keypoint lane. Three options enumerated in [`docs/session-logs/004-push-blocker-large-files.md`](docs/session-logs/004-push-blocker-large-files.md): (A) `git filter-repo` delete from all history *(recommended)*, (B) Git LFS migrate, (C) defer push and keep working locally. Tracked as `task-027` in [`MVP_TASKS.md`](MVP_TASKS.md). Autonomous loop must not execute the destructive rewrite without explicit human go.
6. **Hard ASL-domain negative-challenge types (USER/OBSERVER DECISION).** Mission 3 online-source negative-challenge unblock per [`GOAL.md`](GOAL.md) requires `data/manifests/negative-challenge.json` to cover all 17 [`scripts/evaluate_rawframe_model.py`](scripts/evaluate_rawframe_model.py) `REQUIRED_CHALLENGE_TYPES` (L70-L88) with ≥5 clips per type. The "Online Negative Challenge Source Unblock" prompt's coverage gate and `audit_final_manifests.py` enforce this. Three types are not naturally tractable from purely online raw-video sources:
    - `partial_sign` — an incomplete or aborted attempt at a sign. Online CC datasets contain only complete signs.
    - `wrong_location` — a real ASL sign performed at the wrong body location. Not a category that online ASL datasets isolate.
    - `wrong_palm_orientation` — a real ASL sign performed with the wrong palm orientation. Same constraint as `wrong_location`.

    [`docs/research/asl-domain-negative-challenge-repurposing-research.md`](docs/research/asl-domain-negative-challenge-repurposing-research.md) reviewed already-approved sources (WLASL, ASL Citizen, PopSign-v1) and concluded none of them contain naturally-occurring `partial_sign` / `wrong_location` / `wrong_palm_orientation` content. The autonomous loop cannot decide between these three options without user/observer input:

    - **(a) Accept narrower coverage interpretation.** Reduce the 17-type gate to 14 types and treat the 3 ASL-domain types as a documented limitation in final pilot evidence. Requires editing `REQUIRED_CHALLENGE_TYPES` and the `audit_final_manifests.py` gate. Per [`GOAL.md`](GOAL.md) `current mission` "Do not narrow the 17-type audit gate without explicit human approval", this needs the user's explicit go.
    - **(b) Authorize a clip-truncation / motion-segment transformation step.** Trim approved raw clips (e.g. WLASL `not` cut at 0.4s as a `partial_sign`) and re-decode tensors. This is a transformation that arguably exceeds the raw-RGB-only constraint in [`#arch-no-pretrained`](ARCHITECTURE.md#arch-no-pretrained) and the rawframe pipeline contract; needs explicit approval before implementation.
    - **(c) Defer these types and surface as non-fatal limitation.** Same effect as (a) but framed as "the dataset is intentionally narrower because online sources do not provide these samples" rather than relaxing the gate.

    Autonomous progress on the remaining 10 underfilled types is partially gated. Per [`docs/research/asl-domain-negative-challenge-repurposing-research.md`](docs/research/asl-domain-negative-challenge-repurposing-research.md) Addendum 1 (premise correction, 2026-05-24), [`docs/research/wikimedia-commons-counting-fingerspelling-probe-results.md`](docs/research/wikimedia-commons-counting-fingerspelling-probe-results.md) (Commons probe results, 2026-05-24), and [`docs/research/wikimedia-commons-remaining-types-probe-results.md`](docs/research/wikimedia-commons-remaining-types-probe-results.md) (Commons thumbs_up + idle_hands probe results, 2026-05-24):
    - **Tractable from existing Commons exporter at 5-per-type**: `waving`, `hand_clap` (candidate pools already landed).
    - **Likely tractable, candidate pool surfaced and pending visual review + exporter extension**: `hands_cropped_out` (9 NASA Interview Opportunity .webm B-roll candidates surfaced via `studio host interview` probe).
    - **Constrained by Commons coverage** (joining the decision-required list): `counting` (2 candidates exist, 3-short), `fingerspelling_like_motion` (1 candidate exists, 4-short), `thumbs_up` (0 viable candidates across 6 probes / 180 results, 5-short), `idle_hands` (2 weak candidates across 6 probes / 180 results, 3-short), `mouth_touch` (0 viable candidates across 4 probes / 120 results, 5-short), `casual_non_asl_gesture` (0-1 weak candidates across 4 probes / 120 results, 4-short). Resolution options enumerated in [`docs/research/wikimedia-commons-counting-fingerspelling-probe-results.md`](docs/research/wikimedia-commons-counting-fingerspelling-probe-results.md) and reused for `thumbs_up` / `idle_hands` / `mouth_touch` / `casual_non_asl_gesture` in [`docs/research/wikimedia-commons-remaining-types-probe-results.md`](docs/research/wikimedia-commons-remaining-types-probe-results.md):
        - (a-2) supplement Commons with broader non-Commons CC sources (Internet Archive, etc.) under new source-register approval
        - (b-2) lower per-type minimum from 5 to 2 for these specific types (needs explicit human approval per GOAL.md hard limit)
        - (c-2) exhaustive Commons category traversal as further discovery
        - (d-2) defer as documented non-fatal limitation
    - **Candidate pool identified, pending download + visual review + manifest extension**: `non_target_asl_sign` — ASL Citizen central-directory probe at [`docs/research/asl-citizen-non-target-asl-sign-candidate-pool.md`](docs/research/asl-citizen-non-target-asl-sign-candidate-pool.md) confirms 28 of 30 off-active-module candidate labels match ASL Citizen with 27-40 clips each (well above 5-per-type minimum). Source-register `asl-citizen-school-assignment-raw-videos` already covers scope.

    User clarification on 2026-05-24 changes the operating posture for the 6 Commons-constrained types: use GPT Pro / OpenAI API research to locate broader open/research raw-video source families, and treat open, public, CC, public-domain, noncommercial, and research-only datasets as valid candidates for this noncommercial academic project unless terms plainly prohibit local academic research use. This selects (a-2) as the default next discovery path for those 6 types; it does **not** weaken the 17-type gate, lower the 5-per-type minimum, or bypass exact source-register and per-clip provenance requirements. The first API research memo is at [`artifacts/research/observer-067-source-discovery/source-discovery-memo.md`](artifacts/research/observer-067-source-discovery/source-discovery-memo.md).

    Codex observer/user resume on 2026-05-24 narrows the immediate unblock: continue autonomous work on the six Commons-constrained types via `(a-2)` broader source discovery/import, and retry `waving`, `hand_clap`, and `hands_cropped_out` only as a slower one-at-a-time Commons cooldown lane. This supersedes the STOP-only posture for work that already has an authorized path. It does **not** authorize transforms, gate narrowing, or documented limitation for the three hard ASL-domain types (`partial_sign`, `wrong_location`, `wrong_palm_orientation`); those remain a later user/observer decision unless natural online examples are found under exact source-register review.

    This open decision still blocks final close of the negative-challenge audit pass for the **3 hard ASL-domain types named above** (`partial_sign`, `wrong_location`, `wrong_palm_orientation`) until the user/observer explicitly authorizes pixel-domain transforms or a narrower documented limitation. For the 6 Commons-constrained types, the loop should now continue broader source discovery/import rather than stop. The autonomous loop can also still advance `waving`, `hand_clap`, and `hands_cropped_out` through a slower one-at-a-time Commons cooldown retry without further adjudication.

    Tracked in [`docs/session-logs/054-context-rollover.md`](docs/session-logs/054-context-rollover.md) "Remaining", [`docs/session-logs/058-premise-correction-no-off-target-wlasl.md`](docs/session-logs/058-premise-correction-no-off-target-wlasl.md) (premise correction), [`docs/session-logs/059-commons-counting-fingerspelling-probe-results.md`](docs/session-logs/059-commons-counting-fingerspelling-probe-results.md) (counting + fingerspelling Commons gap), [`docs/research/wikimedia-commons-remaining-types-probe-results.md`](docs/research/wikimedia-commons-remaining-types-probe-results.md) (thumbs_up + idle_hands + mouth_touch + hands_cropped_out + casual_non_asl_gesture Commons probe results), and [`docs/research/asl-domain-negative-challenge-repurposing-research.md`](docs/research/asl-domain-negative-challenge-repurposing-research.md). Autonomous loop must not pick one of (a)/(b)/(c) for the 3 hard ASL-domain types, or (b-2)/(d-2) for the 6 Commons-constrained types, without explicit human or observer adjudication. Option (a-2) is now the default path for the 6 Commons-constrained types.

## deferred decisions

1. Teacher/admin dashboard.
2. Classroom rostering and SSO.
3. Sentence-level ASL recognition.
4. Server-side inference default path.
5. Live 3D mocap/avatar feedback.
6. Research-grade fairness/bias analysis.
7. Production-scale public deployment.
8. `task-015b` `practice_sessions` table (only if session-level analytics is needed).

## research-required decisions

1. Brev instance availability/cost at execution time for the next training round.
2. Browser runtime performance after rawframe ONNX export (parity fixture + latency budget).
3. Whether 20-sign or larger module meets validation gates with the first-party dataset.
4. Whether a phonology reranker improves calibrated acceptance behavior.
