# Return-To-Form M3JA MediaPipe Teacher Hand-Tracker Distillation Goal Loop Prompt

Mission 3JA prompt for the Codex executor after the user restarted the hand
tracking lane and asked whether MediaPipe can be distilled into a model we own.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Build and verify a project-owned browser hand tracker by using MediaPipe only
as an offline teacher for labels, diagnostics, and evaluation. The runtime
student must be this project's scratch-trained model, exported to our browser
format, and must not depend on MediaPipe, OpenPose, YOLO, pretrained landmark
systems, pretrained backbones, or pretrained feature caches.

The immediate product failures to eliminate are:

- two hand tracks collapsing onto one physical hand;
- one hand disappearing when two hands are visible;
- loose, stale, or off-center hand boxes;
- missing or unstable 21-point landmarks;
- handedness or track identity swaps;
- browser demo behavior that looks worse than offline metrics imply.

Continue through local no-spend diagnosis, repair, evaluation, and bounded
student training slices until the acceptance gates pass or a concrete blocker
requires human source, compute, or product-scope approval.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. This prompt.
4. Target contract and current measured state:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/validation/return-to-form-m3iy-detector0-achieved-metrics-consolidation-v1.json`](../validation/return-to-form-m3iy-detector0-achieved-metrics-consolidation-v1.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
5. Local diagnostic media/evidence from the user's hand-tracking video:
   - [`analysis/hand-tracking-recording-2026-06-01/`](../../analysis/hand-tracking-recording-2026-06-01/)
6. Side-worktree hand-tracker code and receipts, if present:
   - `/Users/kelly/Developer/asl-pilot-annotator`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-hands2-receipt.json`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-hand-landmarks-big2.json`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/train_detector_grid_hands2.py`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/train_hands_landmarks.py`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/export_models_web.py`
7. Source/provenance and no-pretrained audits:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`scripts/audit_source_register.mjs`](../../scripts/audit_source_register.mjs)
   - [`scripts/audit_no_pretrained_deps.mjs`](../../scripts/audit_no_pretrained_deps.mjs)
   - [`scripts/audit_no_pretrained_artifact_json.mjs`](../../scripts/audit_no_pretrained_artifact_json.mjs)

## Architecture Boundary

MediaPipe may be used only offline as a teacher. It may create candidate labels,
debug overlays, pseudo-label confidence filters, disagreement reports, and
evaluation references. It must not be imported into browser runtime code, model
cards as a runtime dependency, product inference, feature extraction, or
recognition authority.

Use this exact disclosure whenever teacher labels are involved:

```text
targets offline-derived via MediaPipe Holistic; runtime uses only our scratch-trained model and is not a runtime dependency.
```

The owned student output must include, per frame:

- up to two hand boxes in normalized full-frame coordinates;
- 21 landmarks per visible hand in crop coordinates and mapped full-frame
  coordinates;
- per-hand confidence/presence;
- handedness or stable first/second assignment;
- enough quality metadata to suppress stale, duplicate, or low-confidence
  browser overlays.

## Current Baseline

Treat these facts as current until replaced by fresh receipts:

- M3IY measured hand box IoU is about `0.57`. The first M3JA local fine-tune
  improved the owned heatmap landmark student to test hand PCK@0.10 `0.8009`
  and PCK@0.05 `0.4646` in
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-landmarks-merged-w64-finetune-e3-lr1e4-cont-e3.json`.
  This is still not product-ready.
- Follow-up M3JA landmark probes after that selected checkpoint did not produce
  a validation-selected replacement. Visible-keypoint heatmap CE tied test
  PCK@0.10 around `0.801` but regressed validation to `0.7159`;
  hard-geometry oversampling reached test PCK@0.10 `0.8022` and PCK@0.05
  `0.467` but validation stayed below the selected checkpoint at `0.7221`;
  normalized/center coordinate decoder modes regressed. Do not repeat those as
  blind next steps.
- The current worst-sample report
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-landmarks-best-error-report-test-top16.json`
  and contact sheet
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-landmarks-best-error-report-test-top16.png`
  show the selected landmark student is much weaker on edge/OOB, tiny, and
  vertical-extreme hand geometry: edge PCK@0.10 `0.6637` versus non-edge
  `0.84`, OOB `0.6309` versus in-bounds `0.837`, and small-area `<0.02` PCK
  `0.5695`. Prefer crop/teacher-label quality repair over another generic
  fine-tune.
- The next per-hand tight-crop refinement slice created
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/train_perhand_landmarks_heatmap.py`
  and improved held-out per-hand PCK@0.10 from the old checkpoint's `0.4383`
  to `0.7073` in
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-perhand-hires-w64-e60-lr5e4-cont-e40-lr1e4-cont-e30.json`.
  Tight PCK@0.05 is `0.4056`, still far below the `0.75` gate. The per-hand
  worst-case report
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-perhand-hires-best-error-report-test-top16.json`
  shows edge/OOB crops remain the largest failure family: edge PCK@0.10
  `0.5388` versus non-edge `0.7209`, OOB `0.5107` versus in-bounds `0.7168`.
  Continue with per-hand crop construction, quality filtering, and
  generalization repair before browser export.
- Additional per-hand probes after that checkpoint did not produce a new best.
  Hard-geometry oversampling plus affine/degradation augmentation improved
  edge/OOB/tiny slices slightly, but regressed overall held-out PCK@0.10 to
  `0.7041` and tight PCK@0.05 to `0.401`, so it is diagnostic only. A 64x64
  heatmap-head probe trained from scratch was stopped at epoch 30 with
  validation PCK@0.10 `0.709`, far below the current best validation `0.8247`.
  Do not repeat those as blind next steps; prefer MediaPipe-teacher relabeling,
  crop-cache construction, quality metadata, and held-out crop generalization.
- Train-only quality filtering then removed the lowest-confidence tail from the
  synthetic train split (`8875/9664` crops kept; OOB labels excluded; gradient
  `>=0.012`; contrast `>=0.10`) and produced the current local per-hand best:
  held-out PCK@0.10 `0.7106`, visible PCK@0.10 `0.7128`, tight PCK@0.05
  `0.4121`, in
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-perhand-hires-w64-qualityfilter-lr5e5-e25.json`.
  This remains far below the M3JA landmark gates and worsens edge/OOB/small
  slices, so it is a small selected improvement, not readiness. A mild
  hard-augmentation continuation from that checkpoint regressed overall and
  tight PCK and was not selected.
- A per-hand teacher/student disagreement audit now exists at
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-perhand-quality-cache-audit-test.json`
  with contact sheet
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-perhand-quality-cache-audit-test-top32.png`.
  On held-out test crops, clean crops score PCK@0.10 `0.8315`, but edge crops
  score `0.5241`, OOB `0.4945`, low-gradient `0.5077`, low-contrast `0.35`,
  and `704/3960` test crops are high-error. The current `.cache/perhand-hires`
  cache has `frames.npy`, `kpts.npy`, and `splits.json` but no `rows.json`, so
  true source-frame relabeling requires recovering the generator or rebuilding
  the cache from row-preserving teacher outputs. Prefer targeted offline
  MediaPipe relabel/crop rebuild for mined edge/OOB/low-texture/clean-high-error
  crops over another generic fine-tune.
- The row-preserving rebuild path now has a smoke-tested builder at
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/build_perhand_hires_cache.py`.
  Its smoke output
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/.cache/m3ja-perhand-rows-smoke`
  wrote `96` per-hand crops from `220` source rows, kept `96/96` labeled hands,
  skipped `0`, and preserved source cache, source row index, hand key, clip,
  frame index, teacher box, derived per-hand crop box, and original landmarks.
  Use this path for the next full row-preserving cache/relabel slice instead
  of training directly from the old metadata-poor `.cache/perhand-hires`.
- The full source-preserved context-0.35 rebuild now exists at
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/.cache/m3ja-perhand-rows-sourcepreserved-c35`
  with `30,184` per-hand crops (`22,234` train, `3,545` validation, `4,405`
  test) from PopSign and ASL Citizen teacher rows. The current selected
  checkpoint scores PCK@0.10 `0.659` and PCK@0.05 `0.370` on this harder cache.
  Its source-linked held-out audit has clean PCK@0.10 `0.8398`, edge `0.3358`,
  OOB `0.2897`, and `1,154` high-error test crops. Candidate manifests and an
  offline targeted MediaPipe relabeler now exist. PopSign relabel smokes
  processed `32/32` held-out candidates (`30` selected detections) and `128/128`
  train candidates (`102` selected detections), but the first augmented-cache
  training smoke regressed and no new checkpoint was selected. Next, improve
  targeted relabel quality and source support, especially ASL Citizen hard
  candidates and source-crop expansion/replacement policy, before another
  longer training run.
- Targeted relabel now supports ASL Citizen videos too. It processed `32/32`
  AC smoke candidates (`23` selected detections) and `256/256` AC train
  candidates (`206` selected detections). Additive PopSign+AC relabel,
  replacement-cache, and masked-OOB replacement training smokes all regressed
  below the `0.660` warm-start validation baseline, so no new checkpoint is
  selected. Next, tighten relabel acceptance and edge/OOB label policy, likely
  by excluding unrecoverable edge-truncated labels or adding a reviewed
  visibility/mask contract before another longer student run.
- Strict relabel acceptance now requires selected-hand match, writes selected
  hand only, requires selected visible fraction `>=0.90`, allows at most `2`
  selected OOB keypoints, and bounds selected center distance. This reduced
  accepted relabel writes to `11/128` PopSign candidates and `25/256` ASL
  Citizen candidates, proving the previous replacement cache admitted many
  off-crop/clipped teacher labels. The strict replacement cache excluded and
  replaced `36` source hands. A frozen-BN 12-batch smoke improved validation
  PCK@0.10 `0.6603` -> `0.6618` and test PCK@0.10 `0.6587` -> `0.6607`, but
  tight PCK@0.05 stayed `0.371` and edge/OOB PCK@0.10 regressed slightly
  (`0.3358/0.2897` -> `0.3305/0.284`). The capped 5-epoch continuation did
  not beat the initial checkpoint. Do not repeat a longer tiny strict-
  replacement run without broader accepted labels or a better visibility/mask
  contract.
- The side-worktree `detector0-hands2-receipt.json` reports real two-hand
  collapse improving from `0.476190` in the older grid model to `0.0` in the
  newer single-hand/top-2 NMS head, with two-hand coverage `0.928571` on `84`
  real two-hand frames. This is promising but still below the M3JA gate.
- A decoder NMS sweep on those same `84` real two-hand frames found `0.5` is
  the best measured preview threshold: coverage improves to `0.952381` with
  collapse still `0.0`, while `0.52` already reintroduces collapse. The side
  eval receipt is
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-hands2-existing-eval-nms050.json`.
  The preview web tracker in `/Users/kelly/Developer/asl-pilot-web` now uses
  `HAND_NMS_IOU = 0.5`. This remains below the `0.98` two-hand coverage gate
  and is not Detector 0 promotion.
- Detector failure analysis now exists at
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-hands2-nms050-failure-analysis.json`
  with contact sheet
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-hands2-nms050-failure-analysis.png`.
  It classifies the four remaining NMS `0.5` misses as close/flat/overlap,
  bottom-edge, or tiny-hand geometry. A top-K oracle on the existing stride-8
  detector shows decoder selection can recover only one extra frame
  (`0.964286` max receipt-style coverage), so threshold/top-K tuning is
  exhausted for this checkpoint.
- The selected detector repair is the train-only hard-geometry continuation
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-hands2-hardgeom-os4-e40-lr5e4-cont-nms050.json`.
  It warm-started from the owned `detector0-hands2` student, oversampled `693`
  hard train rows, improved real two-hand coverage to `0.964286`, and kept
  collapse at `0.0`. This is a real improvement but still below the `0.98`
  coverage gate and is not Detector 0 promotion.
- Rejected detector probes: focused hard-tag oversampling plus hand-region
  negative weighting held coverage at `0.964286` but did not recover another
  frame; a stride-4/fine-grid detector trained cleanly but reached only
  `0.952381` coverage and introduced a new miss; merging non-duplicate
  `autolabel-big2` real two-hand rows into the synthetic two-hand cache also
  held at `0.964286`. The next detector repair should use a multi-slot or
  coarse-to-fine hand head, plus broader high-quality real/user diagnostic
  hard labels, rather than another blind optimizer continuation.
- A same-cell multi-slot detector probe now exists in
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/train_detector_grid_hands2.py`
  behind `--hand-slots 2`. The self-test proves two hands in one grid cell no
  longer overwrite each other. Adapted zero-epoch eval preserved coverage
  `0.964286`, but trained two-slot probes either regressed to `0.940476` or
  held at `0.964286` without recovering another frame. Treat the multi-slot
  code as useful diagnostic infrastructure, not the selected detector. Do not
  repeat the same two-slot optimizer probes blindly; next detector work needs
  higher-quality hard labels/hard negatives or a coarse-to-fine second-stage
  crop detector.
- Local diagnostic-frame offline labels now exist at
  `/Users/kelly/Developer/asl-pilot/analysis/hand-tracking-recording-2026-06-01/mediapipe-offline-labels-focus-v1.json`,
  generated by
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/label_image_dir_mediapipe.py`.
  Running the web debug harness with those labels produced visual heuristic
  score `100` but labeled mean best IoU only `0.4498`, recall@0.30 `0.75`, and
  recall@0.50 `0.5` across `12` labeled focus frames. Worst frames were
  `t_11_6s.jpg`, `t_16_8s.jpg`, `t_12_7s.jpg`, and `t_10_4s.jpg`. Caveat:
  these frames come from a screen recording with rendered overlays, so use this
  packet for diagnostic scoring/human review, not automatic training promotion.
- A stricter distinct-assignment detector metric now exists in
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/train_detector_grid_hands2.py`.
  The selected hard-geometry detector still reports receipt-style coverage
  `0.964286` with collapse `0.0`, but the stricter eval receipt
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-hands2-hardgeom-os4-e40-lr5e4-cont-nms050-eval-distinct-v2.json`
  shows `distinct_assigned_coverage` is only `0.428571`, with `45/84` frames
  counted by old coverage while relying on the same predicted box for both
  hands. This matches the user's duplicate-hand live failure and means the old
  coverage metric is not sufficient for promotion.
- Rejected distinct-assignment detector probes: selected-box refinement
  regressed coverage to `0.678571`; two-slot left/right initialization reached
  only coverage `0.928571` and distinct `0.404762`; area-ordered slot-top1 with
  diversity reached coverage `0.583333` and distinct `0.511905`; fine-grid
  area-ordered slot-top1 with diversity reached coverage `0.619048` and
  distinct `0.571429`; the best no-collapse hybrid reached only coverage
  `0.869048` and distinct `0.666667`. Do not repeat this detector family as a
  blind optimizer probe. The next detector repair must directly optimize two
  distinct assigned hand boxes, likely through a set/Hungarian hand detector or
  a landmark-conditioned hand proposal head, and every future detector receipt
  must report both receipt-style coverage and `distinct_assigned_coverage`.
- A first global two-query Hungarian/set detector probe was rejected: real
  coverage `0.107143`, distinct assignment `0.023810`, collapse `0.428571` in
  `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-hand-set-detector-bodyinit-os4-div02-e20-v2.json`.
  However, a top-K oracle over the selected owned grid detector shows the
  candidate generator often contains a useful pair: real top-10 candidate
  oracle distinct assignment `0.833333`, and top-20 `0.928571`. The immediate
  bottleneck is candidate-pair selection/ranking, not raw candidate existence.
  Initial scratch MLP pair selectors over top-10 candidates were rejected:
  synthetic train1200 real distinct `0.142857`, merged-real train2000 real
  distinct `0.119048`, both with oracle `0.833333`. Cached top-20 listwise
  pair ranking then improved only after per-feature z-score normalization:
  unnormalized real distinct assignment `0.333333`, normalized real distinct
  assignment `0.464286`, coverage `0.964286`, collapse `0.0`, with real oracle
  distinct still `0.928571`. A crop/pose-aware top-20 ranker then appended
  owned per-hand landmark-student crop features and improved real distinct
  assignment to `0.523810` while preserving coverage `0.964286` and collapse
  `0.0` at the best tested stopping point (`e20`). This is not promotable; the
  remaining oracle gap is large. Next selector work should keep crop/pose
  evidence but add validation-selected checkpointing, handness/box-quality
  auxiliary targets, or a coarse-to-fine hand proposal head before browser
  export.
- Live browser behavior is the truth surface. A locally green receipt does not
  close the mission if the user-visible `/tracking` demo still duplicates,
  drops, or misplaces hands.

## Allowed Work

Allowed without additional approval:

- local file/code inspection in this repo and the side worktree;
- prompt, receipt, audit, eval, and browser debug harness repairs;
- local CPU/MPS self-tests, smoke tests, evaluation, and bounded training of
  scratch student models;
- offline MediaPipe labeling/evaluation on sources already approved for this
  use and on local diagnostic frames supplied by the user in this thread;
- writing receipts, session logs, debug summaries, contact sheets, and local
  research artifacts;
- exporting/testing ONNX artifacts as default-off research previews after
  local smoke/parity checks pass.

For local training or export, write artifacts under reviewed names such as:

- `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/m3ja-*`
- `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/.cache/m3ja-*`

Keep project claim surfaces fail-closed until all gates pass.

## Forbidden Work

Do not:

- add MediaPipe, OpenPose, YOLO, pretrained landmark systems, pretrained
  backbones, or pretrained feature caches to browser runtime;
- upload raw learner video or local diagnostic frames;
- promote Detector 0, mark it trained/product-ready, or claim ASL correctness
  before gates pass;
- mutate source authority without a documented source-register receipt;
- start, stop, reset, sync, exec, train on, or copy from Brev;
- run paid compute without exact command, spend cap, kill condition, copyback
  path, duplicate-worker check, and explicit user approval;
- overwrite dirty side-worktree files you did not create.

## Acceptance Gates

A browser hand-tracker artifact can be considered M3JA-ready only when tracked
evidence shows:

- hand box recall@IoU0.30 >= `0.98`;
- hand box recall@IoU0.50 >= `0.90`;
- false no-hand rate <= `0.02`;
- false hand-trigger rate on no-hand/empty/low-light hard negatives <= `0.05`;
- duplicate/collapse rate <= `0.02` on two-hand clips;
- two-hand coverage >= `0.98` on a human-reviewed or otherwise high-quality
  held-out set;
- 21 landmarks per visible hand with PCK@0.10 >= `0.90` and PCK@0.05 >=
  `0.75`;
- handedness or first/second assignment swap rate <= `0.02`;
- browser decoder parity for boxes and landmarks is proven;
- user failure frames under
  `analysis/hand-tracking-recording-2026-06-01/` pass without duplicate
  overlays, stale confident boxes, or missing visible hands;
- live `/tracking` preview has no blocking console errors and meets a measured
  latency budget or a documented every-N-frame policy;
- no raw learner upload and no pretrained runtime dependency.

## Required First Slice

For the first M3JA executor slice:

1. Update `GOAL.md` and this prompt so the durable mission matches the user's
   current instruction.
2. Audit current side-worktree receipts, artifacts, and scripts for hand boxes,
   21 landmarks, handedness, and browser export.
3. Run existing local no-spend self-tests or evals that are already prepared
   for duplicate-collapse, landmark, or export parity behavior.
4. Write:
   - `docs/validation/return-to-form-m3ja-mediapipe-teacher-hand-tracker-distillation-v1.json`
   - `docs/session-logs/830-mission-3ja-mediapipe-teacher-hand-tracker-distillation.md`
5. Continue to the smallest bounded local student-model repair/training/eval
   slice that can improve one failing gate.

## Baseline Commands

Recommended local validation commands:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3iy-detector0-achieved-metrics-consolidation-v1.json >/dev/null
git diff --check
```

Recommended side-worktree checks when the files exist:

```sh
python3 -m json.tool /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-hands2-receipt.json >/dev/null
python3 -m json.tool /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-hand-landmarks-big2.json >/dev/null
python3 /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/train_detector_grid_hands2.py --self-test
```

If a training command is run locally, its receipt must include exact command,
device, seed, data roots, output paths, metrics, runtime, and whether the
artifact was copied or promoted.

## Next Actions

Select the concrete next action in each receipt. Valid options:

- `continue_m3ja_local_twohand_detector_training_or_eval`
- `continue_m3ja_landmark_pck_repair_or_eval`
- `continue_m3ja_handedness_track_assignment_repair`
- `continue_m3ja_browser_onnx_parity_and_live_preview`
- `continue_m3ja_teacher_label_quality_review`
- `stop_for_human_source_or_compute_approval`

## Close Condition

Do not close the overall goal just because one slice passes. M3JA can close only
when the acceptance gates pass in receipts and the live browser preview agrees
with the recorded failure-frame harness.
