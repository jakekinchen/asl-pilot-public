# Return-To-Form Hand Landmark Source Feasibility Goal Loop Prompt

Mission 3DX prompt for the Codex executor after the user asked whether a
scratch-trained hand landmark detector is feasible using human-annotated public
datasets.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Superseding Policy Note

After this M3DX prompt ran, the user clarified the label policy. Human/manual
and policy-cleared human-in-loop labels remain preferred, but
MediaPipe-generated hand keypoint labels may be considered later as an offline
weak-supervision fallback if manual/human-in-loop sources are documented as
insufficient and the user explicitly approves the source, license posture,
partitions, import/storage envelope, and generated-label provenance.

This clarification does not allow MediaPipe, OpenPose, YOLO, pretrained
landmark systems, pretrained backbones, or teacher models in browser/runtime
paths. It also does not retroactively approve any source import or training.

## Mission

Produce one local/no-spend, no-training feasibility packet for a scratch
hand-landmark detector route. The packet must answer whether existing
human-annotated public datasets can legally and technically support a
repo-compliant Detector 0 / crop-normalization path, and what the next
reviewable slice should be.

This is not a training mission. It is a source, annotation-schema, and
architecture feasibility mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3DU/M3DV proved the region-grid TCN path can train/evaluate on CUDA, but the
  result was weak and non-promotable: test top-1 `0.1786`, test macro-F1
  `0.0978`, prediction collapse mostly to `white`/`uncle`, and five zero-recall
  test labels.
- Detector 0 is not promoted or properly trained. The latest parallel Detector
  0 held-out recall lane classified the blocker as
  `target_objectness_formulation_deficiency_remains` and selected
  `fix_detector0_presence_objectness_formulation_no_brev`.
- Existing root-cause work says coarse ROI/crop localization and crop-inclusion
  evidence are the current blocker; full hand/posture/face landmarks are not
  already approved as a promoted-lane dependency.
- No pretrained detector, landmark model, backbone, feature extractor,
  generated pseudo-label, teacher model, MediaPipe/OpenPose/YOLO output, or
  `from_pretrained` path may enter the promoted lane.

Initial external source leads to verify, not trust blindly:

- CMU Panoptic HandDB / Simon et al. 2017:
  `https://domedb.perception.cs.cmu.edu/handdb.html`.
  The official page lists manual hand keypoint annotations
  (training/testing) separately from synthetic and multiview-bootstrapped
  annotations. Keep these partitions separate.
- Voxel51 Hugging Face `Voxel51/hand-keypoints`:
  `https://huggingface.co/datasets/Voxel51/hand-keypoints`.
  Treat the dataset card and Dataset Viewer as leads only. The executor must
  verify actual accessible fields, rows, source licenses, and whether labels
  are present via read-only Dataset Viewer metadata before treating it as
  useful.
- FreiHAND:
  `https://lmb.informatik.uni-freiburg.de/projects/freihand/`.
  The project describes 3D hand pose/shape annotations produced by a
  human-in-the-loop semi-automated process. Treat as candidate source pending
  license, annotation format, and no-generated-label policy review.
- InterHand2.6M:
  `https://mks0601.github.io/InterHand2.6M/`.
  The official page lists large-scale single/interacting hand frames and
  annotation IDs for human and machine annotation subsets. Treat only clearly
  human-annotated or rights-cleared subsets as candidate evidence.
- Ultralytics hand-keypoints:
  `https://docs.ultralytics.com/datasets/pose/hand-keypoints/`.
  The docs state annotations were generated with Google MediaPipe. This is a
  useful non-compliant negative example unless a future human review explicitly
  approves a separate manual-label route.

## Required Slice

Complete exactly one local research/feasibility packet:

1. Verify repo and pair state:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
```

2. Validate relevant local evidence:

```sh
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-dataset-training-root-cause-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
```

If an evidence file is missing, record the missing path and continue from the
best available tracked evidence.

3. Use only read-only source checks:

- official project pages, papers, dataset cards, Dataset Viewer metadata, and
  source-register inspection;
- `curl` to Hugging Face Dataset Viewer endpoints such as `/is-valid`, `/splits`,
  `/size`, `/first-rows`, `/statistics`, and `/parquet`;
- no dataset media download, source-register mutation, manifest mutation,
  tensor mutation, or training.

4. Write:

`docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json`

The receipt must include:

- source candidates inspected with URLs, source type, annotation type
  (`manual`, `human_in_loop`, `bootstrapped`, `synthetic`, `generated`, or
  `unknown`), approximate size, split shape, license/rights notes, and whether
  labels are accessible without media import;
- explicit classification of which candidate subsets are plausible for a
  scratch Detector 0 / hand-landmark route and which are disallowed or
  research-only;
- a no-pretrained/no-generated-label boundary, including why MediaPipe-generated
  labels are not acceptable as promoted-lane training labels;
- a proposed minimal model target if feasible, such as 2D 21-keypoint heatmap or
  coordinate regression with tiny random initialization, plus expected
  validation gates;
- a source-register plan if a source looks promising, including exact human
  approval needed before import;
- whether this should supersede, complement, or remain separate from the current
  Detector 0 objectness/crop-normalization route;
- commands run, files changed, blockers, claim boundary, and exactly one next
  action.

5. Write:

`docs/session-logs/488-mission-3dx-hand-landmark-source-feasibility.md`

6. Commit only scoped prompt/receipt/session-log/plan evidence. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_hand_landmark_source_register_review_no_import`
- `continue_hand_landmark_schema_design_no_training`
- `continue_detector0_objectness_repair_without_landmarks`
- `escalate_hand_landmark_strategy_research`
- `stop_for_human_source_license_approval`

## Hard Boundaries

- No model training, fitting, optimizer construction, backward pass,
  checkpoint writing, export, promotion, browser recognition activation, or
  final readiness / ASL correctness claim.
- No Brev command of any kind in this first slice.
- No source-register approval change, source import, media download, manifest
  mutation, tensor mutation, vocabulary mutation, label expansion, pseudo-label
  generation, or raw learner video upload.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- Do not treat public dataset existence as source approval. Rights and license
  review must be explicit.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3DX.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt exists and classifies at least CMU HandDB, Voxel51/hand-keypoints,
   FreiHAND, InterHand2.6M, and a MediaPipe-generated negative example.
4. The receipt separates human/manual labels from bootstrapped, synthetic, and
   generated labels.
5. The receipt states whether a scratch hand-landmark route is feasible enough
   for a next local source/schema slice, blocked on license approval, or not
   worth pursuing before Detector 0 objectness repair.
6. No training, Brev, media import, source mutation, pretrained/generated-label
   path, export, promotion, browser activation, or unsupported product claim
   occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE only if the receipt gives a concrete next action and cleanly
  separates source feasibility from training.
- NUDGE if dataset candidates are listed without license/source/annotation
  classification or if generated labels are not separated from manual labels.
- REDIRECT if the executor tries to train, download media, mutate source files,
  approve a source, or use pretrained/generated landmark outputs.
- ESCALATE if the source/license or architecture decision remains ambiguous
  after local read-only research.
- STOP for human approval when a candidate source is promising but requires
  explicit license, source-register, or data-import authorization.
