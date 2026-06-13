# Return-To-Form Plan

Status: active steering artifact for Mission 3AC and later return-to-form
milestones.

This document separates the durable original strategy from the tactical layer
that may change as evidence lands. `GOAL.md` points to this file so the
executor/observer loop does not keep rewriting the project premise from the
latest training failure.

## Governance

### Original Plan Spine

The spine below is stable. The observer may add evidence notes, but it must not
replace the spine with a broad raw-frame retraining loop, a new data route, a
pretrained shortcut, or a detector-first plan unless the user explicitly
approves that change in the current thread and the change is committed with a
session log.

### Mutable Tactical Overlay

The tactical overlay can change after each reviewable slice. It must record:

- the current smallest active sign set;
- the exact source/licensing status for that set;
- the crop strategy used by the next training proof;
- the validation gates set before training;
- the evidence that justifies expanding, pivoting, or stopping.

Any tactical update that contradicts the spine is a redirect decision, not a
normal continuation.

## Milestone Ladder

The observer should advance through these milestones in order. It should not
invent the next milestone from scratch after each executor turn. If evidence
forces a change, edit this section and write a session log explaining why.

### M3AB - Plan Reconciliation

Status: closed by session 181.

Goal: stop broad 75/95-label drift and align the steering docs to this plan.

Exit evidence:

- `GOAL.md` points at a return-to-form prompt.
- `README.md`, `MVP_TASKS.md`, and
  `docs/model/dataset-and-training-plan.md` no longer route active work into
  Mission 3R or controlled clip-heldout evaluation.
- `node scripts/audit_return_to_form_plan.mjs --json` passes.

### M3AC - Small-Proof Selection And Gates

Status: closed by session 183 / commit `ffb7dd1`.

Goal: choose the smallest defensible fixed-crop proof before any training.

Required subtasks:

1. Select a 5-sign Tier 0 candidate set, with a documented reason each sign is
   likely to be separable under fixed controlled crops.
2. Optionally list a 6-10 sign Tier 1 reserve set, but do not train it until
   Tier 0 learns.
3. Verify source-register eligibility for the selected clips. PopSign-v1 may
   be used if the selected signs have enough raw-video coverage. SemLex /
   ASL-LEX phonology must remain candidate-only until source-register evidence
   and overlap artifacts exist.
4. Write a source/coverage artifact under `docs/research/` that records selected
   labels, source ids, clip counts by split, signer/split limitations, and
   any phonology-coverage status.
5. Write a fixed crop config under `docs/model/` with left-hand, right-hand,
   signing-space/upper-body, and optional head regions.
6. Write pre-training gates under `docs/validation/` before training: target
   train sanity, validation top-1 or macro recall, hard-negative FAR, and
   no-zero-accepted-true-class checks.
7. Update the tactical overlay in this file with the selected signs and gate
   artifact paths.

Hard stop: no model training in M3AC.

### M3AD - Decode And Dataloader Proof

Status: closed by session 185 / commit `a6babe7`.

Goal: prove the selected signs and crop config produce reproducible tensors and
a dataloader batch before training.

Required subtasks:

1. Generate or refresh the Tier 0 train/validation/test manifests from approved
   source clips only.
2. Bind source register, vocabulary review, crop config, and FFmpeg/decode
   provenance hashes.
3. Run a dry-run/check-files path over the selected manifests.
4. Record tensor counts, missing files, crop config hash, source ids, and split
   limitations.

Hard stop: if decode/dataloader proof fails, fix data/crops before training.

### M3AE - Tier 0 Learnability Smoke

Status: closed by session 187; failed train sanity.

Goal: run the smallest training proof and decide from metrics, not vibes.

Required subtasks:

1. Run a short 5-sign fixed-crop training smoke.
2. Record training loss movement, validation top-1/macro recall, confusion
   matrix, hard-negative false-accept rate, and failure classes.
3. Compare against random chance and the pre-written gates.
4. Commit the report and exact command/provenance.

Decision rule:

- If Tier 0 passes, queue M3AF.
- If Tier 0 fails because data/crops are bad, return to M3AC/M3AD with a
  concrete remediation task.
- If Tier 0 fails despite clean data/crops, stop and write a reduced-claim
  recommendation rather than expanding labels.

### M3AE-R - Tier 0 Remediation Diagnosis

Status: closed by session 188 / commit `48c68b7`.

Goal: diagnose the failed Tier 0 smoke before any additional training.

Required subtasks:

1. Preserve the M3AE report as the failure source of truth.
2. Inspect fixed-crop contact sheets and tensor statistics for `dad` and
   `grandpa`, with comparison labels from the same Tier 0 set.
3. Verify whether M3AE training consumed the intended `rgb_regions`
   fixed-crop stack or only the `rgb_frames` compatibility tensor.
4. Classify whether the failure is most likely crop/region coverage, tensor
   payload/preprocessing, architecture fit, source/split limitation, or
   inconclusive.
5. Commit a tracked diagnostic and exactly one next action.

Hard stop: no additional training in M3AE-R.

### M3AE-F - Tier 0 Tensor Contract Fix

Status: closed by session 190 / commit `bd3d98f`.

Goal: make the Tier 0 training/evaluation path consume the intended fixed-region
tensor input before any additional learnability smoke.

Required subtasks:

1. Preserve the M3AE-R diagnostic as the failure source of truth.
2. Inspect `scripts/train_rawframe_model.py::load_tensor_file`,
   `RawFrameClipDataset`, and the M3AE training/evaluation path.
3. Fix the Tier 0 input contract so payloads with `rgb_regions` feed the
   intended fixed-crop stack, or an explicitly region-aware derived input whose
   region order is recorded.
4. Add a tracked receipt proving sampled train/validation/test payloads no
   longer fall back to the `rgb_frames` compatibility slice when `rgb_regions`
   exists.
5. Commit the fix, receipt, tactical overlay update, and one concrete next
   action.

Hard stop: no new learnability smoke in M3AE-F until the tensor contract is
verified.

### M3AE-G - Tier 0 Learnability Smoke Rerun

Status: closed at session 192 / commit `62ff3dd`.

Goal: rerun the bounded 5-sign learnability smoke using the corrected
`rgb_regions_grid_v1` input path.

Required subtasks:

1. Preserve the prior failed M3AE report and the M3AE-F tensor-contract receipt
   as source evidence.
2. Run one bounded from-scratch Tier 0 smoke using only the M3AD manifests,
   approved PopSign source clips, random initialization, and the corrected
   `rgb_regions_grid_v1` input path.
3. Write a new rerun report under `docs/validation/` with the same gate
   comparison fields as M3AE plus the corrected input-contract evidence.
4. Update the tactical overlay with the rerun result and exactly one next
   action.

Hard stop: no label expansion, broad route, export, model-card promotion, or
final-readiness claim in M3AE-G.

### M3AE-H - Tier 0 Failure Remediation Triage

Status: closed at session 194 / commit `e239d34`.

Goal: classify the next concrete remediation action from the failed corrected
Tier 0 rerun before any more training.

Required subtasks:

1. Preserve the M3AE-G rerun report as the current failure source of truth.
2. Inspect fixed-crop contact sheets, region selection, tensor payload
   compatibility, and the model architecture/training configuration.
3. Write a tracked triage report with the M3AE-G metrics, per-label failure
   pattern, crop/contact-sheet observations, tensor-contract status, model
   assessment, blocker classification, and exactly one next action.
4. Update the tactical overlay with the triage report and next action.

Hard stop: no training, label expansion, broad route, export, model-card
promotion, or final-readiness claim in M3AE-H.

### M3AE-I - Tier 0 Model Architecture Microprobe

Status: closed at session 196 / commit `6e1b47b`.

Goal: run one bounded no-label-expansion tiny overfit microprobe on the same
Tier 0 manifests and approved PopSign tensors to isolate the
model/input-adapter/training-budget bottleneck without repeating the compressed
`rgb_regions_grid_v1` full-train-set smoke.

Required subtasks:

1. Preserve the M3AE-H triage report as the source decision for this
   microprobe.
2. Preserve the observer API strategy memo under `artifacts/research/` and
   follow its correction: do not run the drafted same-grid, no-batch-cap,
   12-epoch probe.
3. Run exactly one compliant tiny overfit probe against a sampled subset from
   the same selected five labels and M3AD manifests, with random initialization,
   no new source/media/label inputs, and an input path that preserves crop
   identity/scale.
4. Write a tracked microprobe report with command/configuration, API memo link,
   baseline comparison, loss movement, tiny-subset train-fit metrics,
   per-label recall/confusion evidence, train-fit classification, and exactly
   one next action.
5. Update the tactical overlay with the microprobe report and next action.

Hard stop: no second microprobe run, full train-set parameter-tweak rerun,
label expansion, broad route, export, model-card promotion, final-readiness
claim, Brev stop, duplicate worker, or source approval in M3AE-I.

### M3AE-J - Tier 0 Microprobe-Config Smoke

Status: closed at session 198 / commit `70f6b52`.

Prior status: active after session 196 microprobe selected
`rerun_tier0_smoke_with_microprobe_config`.

Goal: run one bounded no-label-expansion smoke on the same Tier 0 manifests and
approved PopSign tensors using the crop-identity-preserving configuration that
passed the M3AE-I tiny overfit probe.

Required subtasks:

1. Preserve the M3AE-I microprobe report as the source decision for this
   smoke.
2. Re-run the return-to-form, source-register, no-pretrained, JSON,
   decode/dataloader, and tensor-contract checks before training.
3. Run exactly one bounded smoke against the selected five labels with random
   initialization, `pretrained_components: []`, no new source/media/label
   inputs, and an input path that preserves crop identity/scale instead of
   only using the compressed `rgb_regions_grid_v1` 96px mosaic.
4. Write a tracked smoke report with command/configuration, split sample
   counts, baseline comparison, loss movement, train/validation/test metrics or
   exact blockers, per-label evidence, gate classifications, and exactly one
   next action.
5. Update the tactical overlay with the smoke report and next action.

Hard stop: no second microprobe run, second smoke job, label expansion, broad
route, export, model-card promotion, final-readiness claim, Brev stop,
duplicate worker, or source approval in M3AE-J.

### M3AE-K - Tier 0 Label/Split Remediation

Status: closed at session 200 / commit `bef1ec1`.

Goal: diagnose why the M3AE-J crop-identity-preserving full-split smoke fits
the train split but fails validation/test, without running another training job
or changing sources, labels, final gates, export, or promotion state.

Required subtasks:

1. Preserve the M3AE-J smoke report as the source decision for this diagnostic.
2. Re-run the return-to-form, source-register, no-pretrained, JSON,
   decode/dataloader, and tensor-contract checks before analysis.
3. Inspect Tier 0 train/validation/test manifests, source record ids, signer
   identity hashes, source splits, tensor paths, crop config, and M3AE-J
   per-label confusion/recall evidence.
4. Write a tracked remediation report classifying whether the likely blocker is
   split construction, signer/source distribution, label-specific ambiguity,
   crop/input representation, or an unknown blocker, with exactly one next
   action.
5. Update the tactical overlay with the remediation report and next action.

Hard stop: no training job, second smoke, second microprobe, label expansion,
broad route, export, model-card promotion, final-readiness claim, Brev stop,
duplicate worker, or source approval in M3AE-K.

### M3AE-L - Detector 0 Crop-Normalization Bootstrap

Status: closed at `c7f3818`.

Goal: promote the composable localization/crop-normalization lane as the next
milestone after M3AE-I/J/K proved fixed crops can be memorized but do not
generalize under signer-disjoint PopSign validation/test.

Required subtasks:

1. Preserve M3AE-J, M3AE-K, and the observer localization API memo as source
   evidence before changing the next technical objective.
2. Define minimal scratch Detector 0 targets: hand centers/boxes, head or face
   center/box, signing-space or upper-body box, hand/head presence, confidence,
   and optional truncation/occlusion flags. Full hand/body/face landmarks are a
   later auxiliary lane, not this bootstrap gate.
3. Inventory available clean annotation/provenance paths from the existing
   fixed-crop protocol, PopSign frame tensors/contact sheets, and possible
   manual annotation packets. Do not use pretrained-generated MediaPipe,
   OpenPose, YOLO, RTMPose, or unknown labels in the promoted lane.
4. Write a tracked Detector 0 data/provenance/validation bootstrap report with
   label schema, annotation packet path(s), no-pretrained constraints,
   validation gates, crop-normalization ablation shape, stop conditions, and
   exactly one next action.
5. Update the tactical overlay with the bootstrap report and next action.

Hard stop: no detector training, recognizer training, label expansion, source
approval/import, broad route, export, model-card promotion, final-readiness
claim, Brev stop, duplicate worker, or pretrained detector/landmark use in
M3AE-L.

### M3AE-M - Detector 0 Annotation Packet

Status: closed at `6b237cb`.

Goal: create or populate the first manual/manual-verified Detector 0
localization annotation packet for the selected Tier 0 labels before any
Detector 0 training or crop-normalization ablation.

Required subtasks:

1. Preserve the M3AE-L bootstrap report as the schema/provenance/gate source.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Create or populate
   `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
   with manual/manual-verified rows bound to selected label, split, clip/source
   records, tensor/frame references, normalized Detector 0 target boxes/centers,
   review status, label source, and source hashes.
4. Write
   `docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`
   with packet counts, provenance checks, no-pretrained boundary checks,
   readiness classification, Brev status, final-promotion blocker separation,
   and exactly one next action.
5. Update the tactical overlay with the packet/review links and next action.

Hard stop: no Detector 0 training, recognizer training, crop-normalization
ablation, label expansion, source approval/import, broad route, export,
model-card promotion, final-readiness claim, Brev stop, duplicate worker,
push, or pretrained detector/landmark use in M3AE-M.

### M3AE-N - Detector 0 Annotation Review

Status: closed at `b6df8e0`.

Goal: verify or correct the 15 Detector 0 seed rows and record row-level review
evidence before any Detector 0 training or crop-normalization ablation.

Required subtasks:

1. Preserve the M3AE-M packet and review report as the provenance source.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Review or correct packet rows only against retained visual evidence or
   tensor frame references, preserving row/source/tensor provenance.
4. Write
   `docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`
   with row-by-row statuses, corrected/rejected counts, packet hashes,
   evidence inspected, no-pretrained checks, readiness classification, Brev
   status, final-promotion blocker separation, and exactly one next action.
5. Update the tactical overlay with the review report and next action.

Hard stop: no Detector 0 training, recognizer training, crop-normalization
ablation, label expansion, source approval/import, broad route, export,
model-card promotion, final-readiness claim, Brev stop, duplicate worker,
push, or pretrained detector/landmark use in M3AE-N.

### M3AE-O - Detector 0 Annotation Follow-Up

Status: closed at `204e708`.

Goal: replace or independently verify the one rejected held-out `hat` row from
the M3AE-N review before any Detector 0 training or crop-normalization
ablation.

Required subtasks:

1. Preserve the M3AE-N review report as the rejected-row disposition source.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Touch only the rejected `hat` test row, or document why no safe
   approved-source replacement/verification exists.
4. Write
   `docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`
   with rejected-row disposition, packet hashes, evidence inspected,
   no-pretrained checks, readiness classification, Brev status,
   final-promotion blocker separation, and exactly one next action.
5. Update the tactical overlay with the follow-up report and next action.

Hard stop: no Detector 0 training, recognizer training, crop-normalization
ablation, label expansion, source approval/import, broad route, export,
model-card promotion, final-readiness claim, Brev stop, duplicate worker,
push, or pretrained detector/landmark use in M3AE-O.

### M3AE-P - Detector 0 Local Training Smoke

Status: closed at session 210 / commit `c0b05b9`.

Goal: run the smallest local no-spend scratch Detector 0 training smoke against
the verified 15-row packet before any crop-normalization ablation or recognizer
training.

Required subtasks:

1. Preserve the M3AE-O follow-up report as the packet-readiness source.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Build or reuse the smallest scratch Detector 0 smoke needed to train and
   evaluate on the approved packet locally on CPU/MPS only.
4. Write
   `docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`
   with command, local device, packet hash, split counts, loss/metric summaries,
   no-pretrained checks, Brev no-spend boundary, final-promotion blocker
   separation, and exactly one next action.
5. Update the tactical overlay with the smoke report and next action.

Hard stop: no Brev sync/training/spend, recognizer training,
crop-normalization ablation, label expansion, source approval/import, broad
route, export, model-card promotion, final-readiness claim, Brev stop,
duplicate worker, push, or pretrained detector/landmark use in M3AE-P.

### M3AE-Q - Crop Normalization Ablation Design

Status: closed at session 212 / commit `74c3294`.

Goal: define the smallest fixed-crop versus detector-normalized comparison
before any crop-normalization ablation run or recognizer training.

Required subtasks:

1. Preserve the M3AE-P Detector 0 smoke as wiring/loss/metric proof, not a
   detector-quality claim.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Write
   `docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`
   with source artifacts, fixed-crop baseline, detector-normalized candidate,
   dataset rows/splits, metrics, stop rules, no-pretrained/source boundaries,
   Brev no-spend status, final-promotion blocker separation, and exactly one
   next action.
4. Update the tactical overlay with the design artifact and next action.

Hard stop: no crop-normalization ablation run, recognizer training, Detector 0
retraining, label expansion, source approval/import, broad route, export,
model-card promotion, final-readiness claim, Brev stop/sync/training/spend,
duplicate worker, push, implementation-code change, or pretrained
detector/landmark use in M3AE-Q.

### M3AE-S - Crop Normalization Ablation Smoke

Status: closed at session 214 / commit `fb20a06`.

Goal: implement and run exactly one local no-spend fixed-crop versus
detector-normalized ablation smoke following the M3AE-Q design.

Required subtasks:

1. Preserve the M3AE-Q design as the ablation contract.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Add or reuse one focused local helper/script that builds detector-normalized
   tensors from approved Tier 0 artifacts and compares them with the fixed-crop
   baseline.
4. Write
   `docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`
   with source/design hashes, command, local device, split counts, detector
   localization sanity, transform integrity, fixed-crop versus
   detector-normalized recognizer metrics, fallback rates, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
5. Update the tactical overlay with the smoke receipt and next action.

Hard stop: no Brev sync/training/spend, label expansion, source
approval/import, controlled clip-heldout evaluation, broad route, export,
model-card promotion, final-readiness claim, Brev stop, duplicate worker,
final-gate weakening, push, or pretrained detector/landmark use in M3AE-S.

### M3AE-T - Detector 0 Data/Target Remediation Triage

Status: closed at session 216 / commit `74e87d5`.

Goal: diagnose the M3AE-S right/second-hand fallback-gate failure before any
ablation rerun, detector retraining, recognizer training, or packet mutation.

Required subtasks:

1. Preserve the M3AE-S smoke receipt as the current failure source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Inspect the Detector 0 packet target support, right/second-hand optionality,
   fallback accounting, presence threshold, and transform fallback policy using
   only approved Tier 0 artifacts and retained M3AE-S output evidence.
4. Write
   `docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`
   with source/smoke/packet hashes, target-support counts, fallback-rate
   accounting, root-cause classification, no-pretrained/source boundaries,
   Brev no-spend status, final-promotion blocker separation, and exactly one
   next action.
5. Update the tactical overlay with the remediation receipt and next action.

Hard stop: no ablation rerun, detector training, recognizer training, packet
mutation, label expansion, source approval/import, controlled clip-heldout
evaluation, broad route, export, model-card promotion, final-readiness claim,
Brev stop/sync/training/spend, duplicate worker, final-gate weakening, push, or
pretrained detector/landmark use in M3AE-T.

### M3AE-U - Crop Normalization Optional-Target Policy Revision

Status: closed at session 218 / commit `b0b794b`.

Goal: revise the crop-normalization fallback policy so verified absent optional
targets are not counted as transform failures, while missed present targets
remain reportable before any ablation rerun.

Required subtasks:

1. Preserve the M3AE-T remediation receipt as the current failure source of
   truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Write
   `docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`
   with source/smoke/remediation/packet hashes, optional-target fallback
   semantics, verified-absent versus missed-present accounting, threshold/gate
   recommendations, right/second-hand positive-support caveats, final-claim
   boundary separation, and exactly one next action.
4. Update the tactical overlay with the policy artifact and next action.

Hard stop: no ablation rerun, detector training, recognizer training,
implementation-code edit, packet mutation, label expansion, source
approval/import, controlled clip-heldout evaluation, broad route, export,
model-card promotion, final-readiness claim, Brev stop/sync/training/spend,
duplicate worker, final-gate weakening, push, or pretrained detector/landmark
use in M3AE-U.

### M3AE-V - Policy-Aware Crop Normalization Ablation Smoke

Status: closed at session 220 / commit `4ffa8e2`.

Goal: run one bounded local no-spend policy-aware fixed-crop versus
detector-normalized ablation smoke using the M3AE-U optional-target fallback
policy.

Required subtasks:

1. Preserve the M3AE-U policy artifact as the fallback-accounting contract.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Reuse or update one focused local validation helper/script to apply
   policy-aware fallback accounting to the bounded M3AE-S ablation design.
4. Write
   `docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`
   with source/design/smoke/remediation/policy/packet hashes, command, local
   device, raw and policy-aware fallback rates, verified-absent optional-target
   counts, missed-present optional-target counts, `table` expected-present
   right/second-hand support, fixed-crop versus detector-normalized recognizer
   metrics, no-pretrained/source boundaries, Brev no-spend status,
   final-promotion blocker separation, and exactly one next action.
5. Update the tactical overlay with the smoke receipt and next action.

Hard stop: no packet mutation, label expansion, source approval/import,
controlled clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, or pretrained
detector/landmark use in M3AE-V.

### M3AE-W - Detector 0 Optional-Target Support Remediation Triage

Status: closed at session 222 / commit `c95e965`.

Goal: classify the remaining expected-present `table` right/second-hand
missed-present fallback blocker before any packet mutation, Detector 0
retraining, recognizer retraining, or ablation rerun.

Required subtasks:

1. Preserve the M3AE-V policy-aware receipt as the current blocker source of
   truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Inspect packet positive support for `table` right/second-hand, retained
   M3AE-S/M3AE-V fallback evidence, M3AE-U policy semantics, and the Detector 0
   optional-target schema/threshold assumptions using existing approved
   artifacts only.
4. Write
   `docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`
   with source/design/smoke/remediation/policy/policy-aware/packet hashes,
   table positive-support evidence, expected-present miss evidence, root-cause
   classification, concrete remediation recommendation, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
5. Update the tactical overlay with the remediation receipt and next action.

Result:

- receipt:
  [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json);
- classification: `packet_positive_support_scarcity`, with
  `retained_detector0_optional_target_generalization_limit_due_to_sparse_support`
  as a secondary effect;
- key evidence: three reviewed table-positive second-hand packet rows, one per
  split, versus 928 missed-present table right/second-hand decisions out of
  1104 expected-present decisions in M3AE-V;
- exact next action:
  `detector0_table_second_hand_packet_expansion_design`.

Hard stop: no packet mutation, Detector 0 retraining, recognizer training,
ablation rerun, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, or pretrained
detector/landmark use in M3AE-W.

### M3AE-X - Detector 0 Table Second-Hand Packet Expansion Design

Status: completed by session 224; closed by observer redirect 225.

Goal: design a bounded expansion path for additional `table`
`right_or_second_hand` packet support from already approved Tier 0 PopSign
manifests before any packet mutation, box approval, Detector 0 retraining,
recognizer retraining, or ablation rerun.

Required subtasks:

1. Preserve the M3AE-W remediation receipt as the current blocker source of
   truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Define candidate-selection criteria for additional `table`
   `right_or_second_hand` rows using approved Tier 0 manifests, retained tensor
   paths, contact-sheet/frame evidence, and manual-review rules only.
4. Write
   `docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`
   with source/remediation/policy/policy-aware/packet hashes, candidate
   criteria, split-balance targets, manual-review requirements, non-mutation
   boundaries, no-pretrained/source boundaries, Brev no-spend status,
   final-promotion blocker separation, and exactly one next action.
5. Update the tactical overlay with the design artifact and next action.

Result:

- design artifact:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md);
- split-balance design: review up to six new `table`
  `right_or_second_hand` candidate rows per split, targeting at least five
  total reviewed positives per split before any retrain or ablation rerun;
- candidate scope: approved Tier 0 PopSign `table` manifest rows only, using
  retained tensor paths, `full_frame_reference` evidence, and manual review;
- exact next action:
  `detector0_table_second_hand_candidate_packet_review`.

Hard stop: no packet mutation, approved box annotation, Detector 0 retraining,
recognizer training, ablation rerun, label expansion, source approval/import,
controlled clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, or pretrained
detector/landmark use in M3AE-X.

### M3AE-Y - Detector 0 Table Second-Hand Candidate Packet Review

Status: completed by session 226; closed by observer redirect 227.

Goal: create and review one bounded candidate packet for additional `table`
`right_or_second_hand` support from already approved Tier 0 PopSign manifests,
while preserving the approved Detector 0 packet unchanged.

Required subtasks:

1. Preserve the M3AE-X design artifact as the candidate-review source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Review up to six new `table` `right_or_second_hand` candidate rows per
   split from approved Tier 0 manifests, existing tensor paths,
   `full_frame_reference` evidence, and retained contact-sheet evidence.
4. Record candidate-scoped statuses, provenance, candidate boxes, accepted and
   rejected counts by split, packet unchanged proof, M3AE-V baseline, and
   M3AE-X target status in
   `docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`.
5. Update the tactical overlay with the candidate-review artifact and exactly
   one next action.

Result:

- candidate-review artifact:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md);
- reviewed rows: 17 new candidate rows from approved Tier 0 PopSign `table`
  manifests, with 6 train, 6 validation, and 5 test candidates;
- target status: M3AE-X's minimum of at least five total
  candidate-or-existing reviewed positives per split is met
  (train 7, validation 7, test 6);
- packet status: approved Detector 0 packet unchanged at
  `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34`;
- exact next action:
  `detector0_table_second_hand_packet_mutation`.

Hard stop: no approved packet mutation, approved box annotation, Detector 0
retraining, recognizer training, ablation rerun, label expansion, source
approval/import, controlled clip-heldout evaluation, broad route, export,
model-card promotion, final-readiness claim, Brev stop/sync/training/spend,
duplicate worker, final-gate weakening, push, product-runtime code change, or
pretrained detector/landmark use in M3AE-Y.

### M3AE-Z - Detector 0 Table Second-Hand Packet Mutation

Status: complete.

Goal: mutate the approved Detector 0 packet by adding the accepted M3AE-Y
`table` `right_or_second_hand` candidate rows with stable packet row ids,
complete provenance, updated summary counts, and a mutation receipt.

Required subtasks:

1. Preserve the M3AE-Y candidate-review artifact as the packet-mutation source
   of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Add only accepted M3AE-Y candidates to
   `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`;
   do not add rejected or unreviewed candidates.
4. Preserve the packet target schema, source provenance, pre/post hashes,
   row-id stability, and final-promotion blocker separation.
5. Write
   `docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`
   with added row ids, counts before/after, packet hashes, candidate-review
   hash, no-pretrained/source/Brev boundaries, and exactly one next action.
6. Update the tactical overlay with the mutation receipt and next action.

Result:

- mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json);
- packet hash before mutation:
  `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34`;
- packet hash after mutation:
  `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`;
- result: M3AE-Z added 17 accepted M3AE-Y `table`
  right/second-hand candidate rows to the approved Detector 0 packet, raising
  packet rows from 15 to 32 and table right/second-hand support to train 7,
  validation 7, and test 6;
- schema assessment: the mutation receipt separates candidate sufficiency from
  target-schema risk; independent left/right boxes are usable only for the next
  tiny scratch Detector 0 smoke, and a two-hand union/contact-region schema
  slice remains preferred if the smoke does not improve second-hand
  localization cleanly;
- exact next action:
  `detector0_expanded_packet_training_smoke`.

Hard stop: no Detector 0 retraining, recognizer training, ablation rerun, label
expansion, source approval/import, controlled clip-heldout evaluation, broad
route, export, model-card promotion, final-readiness claim, Brev
stop/sync/training/spend, duplicate worker, final-gate weakening, push,
product-runtime code change, or pretrained detector/landmark use in M3AE-Z.

### M3AE-AA - Detector 0 Expanded Packet Training Smoke

Status: complete.

Goal: run one local no-spend scratch Detector 0 training smoke on the expanded
32-row packet from M3AE-Z to test whether the added `table`
`right_or_second_hand` support improves second-hand localization enough to
justify the next crop-normalization step.

Required subtasks:

1. Preserve the M3AE-Z mutation receipt and expanded packet hash as source of
   truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Train only a tiny scratch Detector 0 smoke locally on CPU/MPS against the
   approved expanded packet; do not use Brev compute.
4. Report train/validation/test localization metrics, including a `table`
   `right_or_second_hand` slice and an M3AE-P comparison when metric
   definitions allow it.
5. Interpret the result against the M3AE-Z target-schema assessment: independent
   boxes are smoke-usable only, and a two-hand union/contact-region schema
   revision is the fallback if second-hand behavior remains weak or ambiguous.
6. Write
   `docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`
   with command, local device, expanded packet hash, split counts, metrics,
   no-pretrained/source/Brev boundaries, final-promotion blocker separation,
   and exactly one next action.
7. Update the tactical overlay with the expanded smoke receipt and next action.

Result:

- expanded smoke receipt:
  [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json);
- receipt hash:
  `baa2d2f958f50e299fb8d59e2ea2a0d081dd8995181da1719d60ead0c4971def`;
- local device: `cpu`;
- result: local train-path sanity passed on the expanded 32-row packet
  (`train_presence_accuracy=1.0`, `train_present_box_mae=0.11727628856897354`,
  `loss_drop_fraction_from_initial_to_best=0.8769645964888547`), but held-out
  `table` right/second-hand presence remained weak (`validation=0.2857142984867096`,
  `test=0.3333333432674408`);
- schema interpretation: independent left/right boxes remain smoke-usable but
  not honest enough to justify the crop-normalization ablation rerun;
- exact next action:
  `detector0_two_hand_union_schema_revision`.

Hard stop: no crop-normalization ablation rerun, recognizer training, label
expansion, source approval/import, controlled clip-heldout evaluation, broad
route, export, model-card promotion, final-readiness claim, Brev
stop/sync/training/spend, duplicate worker, final-gate weakening, push,
product-runtime code change, or pretrained detector/landmark use in M3AE-AA.

### M3AE-AB - Detector 0 Two-Hand Union Schema Revision

Status: complete.

Goal: define a two-hand union/contact-region target schema for overlapping
`table` hands before any more Detector 0 training or crop-normalization
ablation.

Required subtasks:

1. Preserve the M3AE-AA expanded-packet smoke as the trigger evidence.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Define target semantics for `table_two_hand_union_or_contact_region`.
4. Define derivation rules from reviewed `left_or_first_hand` and
   `right_or_second_hand` boxes, including manual-review fallback conditions.
5. Define later packet-mutation scope without mutating the packet in this
   slice.
6. Define local validation gates and stop criteria for the first smoke that
   uses this schema.
7. Write
   `docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`
   with trigger evidence, target semantics, derivation/review/provenance rules,
   validation gates, no-pretrained/source/Brev boundaries, final-promotion
   blocker separation, and exactly one next action.
8. Update the tactical overlay with the schema artifact and next action.

Result:

- schema artifact:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md);
- schema artifact hash:
  `4e0972b77304c09ffa3e4f5fee4c3b9f71c26f6efe2fe14a13eed82773892716`;
- result: M3AE-AB defined `table_two_hand_union_or_contact_region` as a
  derived two-hand union/contact remediation target for `table` frames, using
  reviewed left/right boxes as evidence only and preserving packet mutation as
  a later bounded no-training slice;
- exact next action:
  `detector0_two_hand_union_packet_mutation`.

Hard stop: no packet mutation, Detector 0 training, crop-normalization ablation
rerun, recognizer training, label expansion, source approval/import,
controlled clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, or pretrained
detector/landmark use in M3AE-AB.

### M3AE-AC - Detector 0 Two-Hand Union Packet Mutation

Status: closed at `334e7b1`.

Goal: add the M3AE-AB `table_two_hand_union_or_contact_region` target to the
approved Detector 0 packet without adding rows or running training.

Required subtasks:

1. Preserve the M3AE-AB schema artifact as the mutation source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Verify the current packet pre-hash is the expanded 32-row packet hash.
4. Add the union/contact target schema and target objects to existing packet
   rows only.
5. Derive present targets only for existing `label_id=table` rows that satisfy
   the M3AE-AB rules; mark non-table rows absent.
6. Stop with remediation if any table row is unresolved, malformed, or too
   broad under the schema thresholds.
7. Write
   `docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`
   with pre/post packet hashes, schema hash, derived counts, unresolved counts,
   no-pretrained/source/Brev boundaries, final-promotion blocker separation,
   and exactly one next action.
8. Update the tactical overlay with the mutation receipt and next action.

Hard stop: no row additions, Detector 0 training, crop-normalization ablation
rerun, recognizer training, label expansion, source approval/import,
controlled clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, generated
pseudo-labels, or pretrained detector/landmark use in M3AE-AC.

Result:

- mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json);
- packet post-hash:
  `b0456313f78f0ddb9a4656876f2021046e4324f8cd06bc7a62021579ff56144f`;
- result: added `table_two_hand_union_or_contact_region` target objects to all
  32 existing packet rows without adding rows, derived 19 present `table`
  union/contact targets (train 6, validation 7, test 6), and left
  `det0-v0-train-table-000376-f010` unresolved because its required
  0.02-margin union width is `0.88`, above the M3AE-AB `0.85` threshold;
- exact next action:
  `detector0_data_or_target_remediation`.

### M3AE-AD - Detector 0 Union Target Remediation

Status: closed at `b7e1836`.

Goal: diagnose and remediate the single unresolved M3AE-AC
`table_two_hand_union_or_contact_region` target before any union-target
Detector 0 smoke.

Required subtasks:

1. Preserve the M3AE-AC mutation receipt as the failure source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Inspect `det0-v0-train-table-000376-f010`, its reviewed left/right source
   boxes, the M3AE-AB width threshold, and retained source evidence.
4. Classify whether the unresolved row is a schema-threshold issue,
   target-derivation/provenance issue, row-quality issue, packet-support issue,
   or stop/reduced-claim condition.
5. Mutate only existing packet target metadata if the remediation is a bounded
   correction that preserves the schema/source boundaries; otherwise select the
   bounded follow-up as the next action.
6. Write
   `docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`
   with source/schema/packet/mutation hashes, unresolved-row analysis,
   classification, any packet correction proof, no-pretrained/source/Brev
   boundaries, final-promotion blocker separation, and exactly one next action.
7. Update the tactical overlay with the remediation receipt and next action.

Hard stop: no row additions, Detector 0 training, crop-normalization ablation
rerun, recognizer training, label expansion, source approval/import,
controlled clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, generated
pseudo-labels, schema weakening, or pretrained detector/landmark use in
M3AE-AD.

Result:

- remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json);
- result: classified `det0-v0-train-table-000376-f010` as
  `schema_threshold_margin_policy_issue`; the raw reviewed two-hand union
  width is `0.84`, but the fixed `0.02` context margin expands the width to
  `0.88` against the M3AE-AB `0.85` cap;
- packet correction: none, because packet edits would silently reinterpret the
  schema margin/threshold rule;
- exact next action:
  `detector0_two_hand_union_schema_revision`.

### M3AE-AE - Detector 0 Two-Hand Union Margin Schema Revision

Status: closed at session 240 / commit `3294ce6`.

Goal: revise the M3AE-AB `table_two_hand_union_or_contact_region` margin or
threshold semantics for the M3AE-AD edge case before any packet correction or
union-target Detector 0 smoke.

Required subtasks:

1. Preserve the M3AE-AD remediation receipt as the failure source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Analyze whether fixed margin should be clipped, conditionally reduced,
   evaluated before clipping, or governed by revised width/area policy for wide
   but valid reviewed `table` rows.
4. Keep reviewed left/right boxes as derivation evidence only; do not introduce
   generated pseudo-labels or pretrained detector/landmark outputs.
5. Do not mutate the Detector 0 packet in this slice.
6. Write
   `docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`
   with the selected semantics, edge-case handling, no-pretrained/source/Brev
   boundaries, final-promotion blocker separation, and exactly one next action.
7. Update the tactical overlay with the schema revision artifact and next
   action.

Hard stop: no packet mutation, row additions, Detector 0 training,
crop-normalization ablation rerun, recognizer training, label expansion, source
approval/import, controlled clip-heldout evaluation, broad route, export,
model-card promotion, final-readiness claim, Brev stop/sync/training/spend,
duplicate worker, final-gate weakening, push, product-runtime code change,
generated pseudo-labels, or pretrained detector/landmark use in M3AE-AE.

Result:

- schema revision artifact:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md);
- selected semantics: `bounded_adaptive_context_margin`;
- edge-case handling: `det0-v0-train-table-000376-f010` remains valid because
  the raw union width is `0.84`, the desired `0.02` context may be reduced to
  `effective_margin_x=0.005`, and the revised target box is
  `[0.015, 0.55, 0.865, 0.84]`;
- read-only projection: applying the revised semantics in a later mutation
  leaves zero unresolved table rows and expected present support train 7 /
  validation 7 / test 6;
- exact next action:
  `detector0_two_hand_union_packet_mutation_continue`.

### M3AE-AF - Detector 0 Two-Hand Union Packet Mutation Continue

Status: closed at session 242 / commit `054a193`.

Goal: apply the M3AE-AE bounded adaptive context-margin semantics to existing
`table_two_hand_union_or_contact_region` targets in the approved Detector 0
packet before any union-target Detector 0 smoke.

Required subtasks:

1. Preserve the M3AE-AE schema revision as the derivation-policy source of
   truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Mutate only existing packet rows and only the
   `table_two_hand_union_or_contact_region` target objects; do not add rows.
4. Resolve `det0-v0-train-table-000376-f010` using the bounded adaptive
   context-margin semantics unless current packet evidence proves a
   contradiction.
5. Write
   `docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`
   with pre/post packet hashes, schema revision hash, changed target ids,
   effective context margins for reduced-margin rows, unresolved row counts,
   support counts by split, no-pretrained/source/Brev boundaries,
   final-promotion blocker separation, and exactly one next action.
6. Update the tactical overlay with the mutation receipt and next action.

Hard stop: no row additions, Detector 0 training, crop-normalization ablation
rerun, recognizer training, label expansion, source approval/import,
controlled clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop/sync/training/spend, duplicate worker,
final-gate weakening, push, product-runtime code change, generated
pseudo-labels, schema weakening, or pretrained detector/landmark use in
M3AE-AF.

Result:

- mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json);
- packet hash changed from
  `b0456313f78f0ddb9a4656876f2021046e4324f8cd06bc7a62021579ff56144f`
  to `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`;
- changed target: one existing `table_two_hand_union_or_contact_region` object
  for `det0-v0-train-table-000376-f010`, with no row additions;
- support after mutation: train 7 / validation 7 / test 6 present
  union/contact targets and zero unresolved table rows;
- exact next action:
  `detector0_two_hand_union_training_smoke`.

### M3AE-AG - Detector 0 Two-Hand Union Training Smoke

Status: closed at session 244 / commit `96310db`.

Goal: run one bounded local no-spend scratch Detector 0 smoke against the
resolved `table_two_hand_union_or_contact_region` target before any
crop-normalization ablation rerun or recognizer training.

Required subtasks:

1. Preserve the M3AE-AF mutation receipt as the packet/target source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Build or reuse the smallest local scratch Detector 0 smoke path, preferring
   focused reuse of M3AE-P / M3AE-AA smoke work over broad training-framework
   changes.
4. Consume only approved packet rows and existing tensor paths from packet hash
   `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`.
5. Write
   `docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`
   with command, local device, packet hash, split counts, model summary,
   loss/metric summaries, table union/contact metrics, no-pretrained/source/
   Brev boundaries, final-promotion blocker separation, and exactly one next
   action.
6. Update the tactical overlay with the smoke receipt and next action.

Hard stop: no packet mutation, row additions, Brev sync/training/spend,
crop-normalization ablation rerun, recognizer training, label expansion, source
approval/import, controlled clip-heldout evaluation, broad route, export,
model-card promotion, final-readiness claim, Brev stop, duplicate worker,
final-gate weakening, product-runtime code change, generated pseudo-labels, or
pretrained detector/landmark use in M3AE-AG.

Result:

- smoke receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json);
- packet hash:
  `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`;
- split counts: train 11 / validation 11 / test 10;
- present union/contact support: train 7 / validation 7 / test 6;
- train presence accuracy reached `1.0`, but train union/contact box MAE was
  `0.18746726214885712` against the `0.15` train-path cap;
- held-out table union/contact behavior remained weak: validation presence
  `0.2857142984867096`, validation mean IoU `0.0`, test presence
  `0.3333333432674408`, and test mean IoU `0.0747925192117691`;
- exact next action:
  `detector0_union_target_data_or_schema_remediation`.

### M3AE-AH - Detector 0 Union-Target Data/Schema Remediation

Status: closed at session 246 / commit `35eab66`.

Goal: diagnose why the M3AE-AG local union-target smoke failed train-path
localization sanity before any crop-normalization ablation rerun, recognizer
training, or packet mutation.

Required subtasks:

1. Preserve the M3AE-AG smoke receipt as the failure source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Inspect current `table_two_hand_union_or_contact_region` packet targets,
   frame indices, tensor paths, tensor hashes, source records, split labels,
   signer hashes, and normalized `xyxy` values.
4. Check whether the smoke consumed the intended packet rows, frame indices,
   tensor payloads, target ids, and target coordinates.
5. Classify the failure as a packet data issue, tensor/frame alignment issue,
   target schema issue, smoke implementation/instrumentation issue,
   insufficient no-new-source support, or stop/reduced-claim condition.
6. Write
   `docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`
   with packet/smoke/schema/source hashes, frame/tensor/target-alignment
   checks, geometry summary, classification, no-pretrained/source/Brev
   boundaries, final-promotion blocker separation, and exactly one next action.
7. Update the tactical overlay with the remediation receipt and next action.

Hard stop: no Detector 0 training or training-smoke rerun, packet mutation, row
additions, Brev sync/training/spend, crop-normalization ablation rerun,
recognizer training, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop, duplicate worker, final-gate weakening,
product-runtime code change, generated pseudo-labels, schema weakening, or
pretrained detector/landmark use in M3AE-AH.

Result:

- remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json);
- packet target-derivation mismatches: `0`;
- tensor hash mismatches: `0`;
- M3AE-AG smoke-row alignment mismatches: `0`;
- train-split median constant-box baseline MAE:
  `0.04107142857142857`, below the `0.15` train-path cap;
- M3AE-AG train box MAE:
  `0.18746726214885712`;
- classification:
  `smoke_implementation_instrumentation_issue`;
- exact next action:
  `detector0_union_target_training_smoke_continue`.

### M3AE-AI - Detector 0 Union-Target Training Smoke Continue

Status: closed at session 248 / commit `ebe1398`.

Goal: repair the local union-target smoke instrumentation or training path, then
run exactly one bounded local no-spend union-target smoke with row-level
predictions and target-local constant baselines.

Required subtasks:

1. Preserve the M3AE-AH remediation receipt as the failure-classification
   source of truth.
2. Re-run return-to-form, loop-premise, source-register, no-pretrained, JSON,
   decode/dataloader, tensor-contract, diff, and Brev status checks.
3. Repair the local union-target smoke path enough to record row-level
   predictions, target-local constant baselines, and per-row/per-split error
   summaries.
4. Run exactly one bounded local CPU/MPS smoke against the current approved
   packet and `table_two_hand_union_or_contact_region` target.
5. Write
   `docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`
   with packet/remediation/smoke/schema/source hashes, model summary,
   train/validation/test metrics, row-level predictions, target-local
   baselines, no-pretrained/source/Brev boundaries, final-promotion blocker
   separation, and exactly one next action.
6. Update the tactical overlay with the smoke-continue receipt and next action.

Hard stop: no packet mutation, row additions, Brev sync/training/spend,
crop-normalization ablation rerun, recognizer training, label expansion, source
approval/import, controlled clip-heldout evaluation, broad route, export,
model-card promotion, final-readiness claim, Brev stop, duplicate worker,
final-gate weakening, product-runtime code change, generated pseudo-labels,
schema weakening, or pretrained detector/landmark use in M3AE-AI.

### M3AE-AJ - Detector 0 Union-Target Median-Box Baseline Diagnostic

Status: closed at session 250 / commit `4418284`.

Goal: establish the train-derived no-training mean/median constant-box baseline
for `table_two_hand_union_or_contact_region` as the reference bar before any
further trainable Detector 0 formulation, crop-normalization ablation, or
recognizer work.

Result:

- baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- classification:
  `median_box_baseline_reproduced_training_path_reformulation_required`;
- train-derived median constant-box MAE:
  `0.04107142239809036`;
- M3AE-AG/M3AE-AI train box MAE:
  `0.18746726214885712`;
- direct comparison: the median constant box beats both M3AE-AG and M3AE-AI
  on train, validation, and test present-target box MAE;
- exact next action:
  `detector0_union_target_architecture_reformulation_design`.

Hard stop: no Detector 0 training or training-smoke retry, packet mutation, row
additions, Brev sync/training/spend, crop-normalization ablation rerun,
recognizer training, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop, duplicate worker, final-gate weakening,
product-runtime code change, generated pseudo-labels, schema weakening, or
pretrained detector/landmark use in M3AE-AJ.

### M3AE-AK - Detector 0 Union-Target Architecture Reformulation Design

Status: closed at session 252 / commit `1634cc1`.

Goal: design, without training, one trainable Detector 0 union-target
formulation that has a concrete path to beat the M3AE-AJ train-derived
median-box baseline before any crop-normalization ablation or recognizer work.

Inputs:

1. M3AE-AJ median-box diagnostic receipt.
2. Observer-249 API diagnostic.
3. M3AE-AG/AH/AI union-target smoke and remediation receipts.
4. Current approved Detector 0 packet and Tier 0 manifests.

Reviewable output:

1. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md).
2. Reject the M3AE-AG/AJ MLP-over-downsampled-full-frame formulation with
   explicit evidence from the median-box comparison.
3. Select exactly one future trainable formulation and specify input
   representation, target encoding, loss, initialization, local no-spend bounds,
   success gate, and stop rule.
4. Update the tactical overlay with exactly one next action.

Hard stop: no Detector 0 training or training-smoke retry, packet mutation, row
additions, Brev sync/training/spend, crop-normalization ablation rerun,
recognizer training, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop, duplicate worker, final-gate weakening,
product-runtime code change, generated pseudo-labels, schema weakening, or
pretrained detector/landmark use in M3AE-AK.

Result:

- design artifact:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md);
- selected formulation:
  `anchor_residual_coordconv_union_target_microprobe_v1`;
- required future train gate:
  beat the M3AE-AJ train median-box MAE `0.04107142239809036` with train
  presence accuracy `1.0` and train mean IoU above `0.6165503859519958`;
- exact next action:
  `detector0_union_target_architecture_microprobe`.

### M3AE-AL - Detector 0 Union-Target Architecture Microprobe

Status: closed at session 254 / commit `403c8ee`.

Goal: run one bounded local no-spend train-fit microprobe for the M3AE-AK
selected formulation, proving whether it can beat the M3AE-AJ train median-box
baseline before any held-out behavior check, crop-normalization ablation, or
recognizer work.

Inputs:

1. M3AE-AK architecture-reformulation design artifact.
2. M3AE-AJ median-box diagnostic receipt.
3. Observer-249 API diagnostic.
4. M3AE-AG/AH/AI union-target smoke and remediation receipts.
5. Current approved Detector 0 packet and Tier 0 manifests.

Reviewable output:

1. Run exactly one local no-spend microprobe for
   `anchor_residual_coordconv_union_target_microprobe_v1` using current packet
   tensors and the M3AE-AJ train median box as anchor.
2. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json).
3. Record row-level train/validation/test predictions, per-split metrics, and
   direct comparison to the M3AE-AJ median baseline.
4. Update the tactical overlay with exactly one next action.

Hard stop: no generic Detector 0 training-smoke retry, packet mutation, row
additions, Brev sync/training/spend, crop-normalization ablation rerun,
recognizer training, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop, duplicate worker, final-gate weakening,
product-runtime code change, generated pseudo-labels, schema weakening, or
pretrained detector/landmark use in M3AE-AL.

Result:

- microprobe receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json);
- selected formulation:
  `anchor_residual_coordconv_union_target_microprobe_v1`;
- train pass gate:
  presence accuracy `1.0`, present-box MAE `0.02091207727789879` below the
  M3AE-AJ median-box MAE `0.04107142239809036`, and present-box mean IoU
  `0.7846036553382874` above the M3AE-AJ median-box IoU
  `0.6165503859519958`;
- held-out metrics are report-only in M3AE-AL: validation present-box MAE
  `0.08475374430418015` and test present-box MAE `0.09988119453191757`;
- exact next action:
  `detector0_union_target_heldout_behavior_check_design`.

### M3AE-AM - Detector 0 Union-Target Held-Out Behavior Check Design

Status: closed at session 256 / commit `e202fde`.

Goal: design, without rerunning training, the exact held-out behavior check
needed after M3AE-AL proved train-set fit but reported weak validation/test
behavior.

Inputs:

1. M3AE-AL architecture-microprobe receipt and row-level predictions.
2. M3AE-AK architecture-reformulation design artifact.
3. M3AE-AJ median-box diagnostic receipt.
4. Observer-249 API diagnostic.
5. Current approved Detector 0 packet and Tier 0 manifests.

Reviewable output:

1. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md).
2. Define the row-level held-out questions, split metrics, median-baseline
   comparisons, false-positive/false-negative accounting, pass/fail gates, and
   stop rules for a future no-training check.
3. Preserve the fact that M3AE-AL passed train gates but validation/test metrics
   are weak/report-only and do not authorize ablation or recognizer work.
4. Update the tactical overlay with exactly one next action.

Hard stop: no microprobe rerun, generic Detector 0 training-smoke retry, packet
mutation, row additions, Brev sync/training/spend, crop-normalization ablation
rerun, recognizer training, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop, duplicate worker, final-gate weakening,
product-runtime code change, generated pseudo-labels, schema weakening, or
pretrained detector/landmark use in M3AE-AM.

Result:

- design artifact:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md);
- evidence carried forward:
  M3AE-AL train gate passed, but validation presence accuracy
  `0.27272728085517883`, validation present-box MAE
  `0.08475374430418015`, test presence accuracy `0.4000000059604645`, and test
  present-box MAE `0.09988119453191757` remain weak/report-only;
- future fixed-threshold gates:
  validation/test presence accuracy at least `0.80`, false positives and false
  negatives no more than `1` per held-out split, and validation/test box MAE and
  IoU no worse than the M3AE-AJ median baseline before any ablation design;
- exact next action:
  `detector0_union_target_heldout_behavior_check`.

### M3AE-AN - Detector 0 Union-Target Held-Out Behavior Check

Status: closed at session 258 / commit `06300a1`.

Goal: run one local no-spend, no-training held-out behavior check over the
existing M3AE-AL receipt, closing the report-only validation/test evidence
before any crop-normalization ablation, recognizer training, export,
promotion, or product claim.

Inputs:

1. M3AE-AM held-out behavior check design artifact.
2. M3AE-AL architecture-microprobe receipt and row-level predictions.
3. M3AE-AJ median-box diagnostic receipt.
4. M3AE-AK architecture-reformulation design artifact.
5. Observer-249 API diagnostic.
6. Current approved Detector 0 packet and Tier 0 manifest identifiers/hashes.

Reviewable output:

1. Parse only existing M3AE-AL row-level predictions, split metrics, and
   median-baseline comparison. Do not load image or tensor payloads.
2. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json).
3. Record fixed-threshold validation/test false positives and false negatives,
   row-level table-vs-non-table score behavior, median-baseline comparison by
   split and row, diagnostic threshold-sweep behavior without threshold
   selection, failure classification, and exactly one next action.
4. Update the tactical overlay with exactly one next action.

Hard stop: no microprobe rerun, Detector 0 training or training-smoke retry,
image/tensor payload load, packet mutation, row additions, Brev
sync/training/spend, crop-normalization ablation rerun, recognizer training,
label expansion, source approval/import, controlled clip-heldout evaluation,
broad route, export, model-card promotion, final-readiness claim, Brev stop,
duplicate worker, final-gate weakening, product-runtime code change, generated
pseudo-labels, schema weakening, threshold promotion, or pretrained
detector/landmark use in M3AE-AN.

Result:

- receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json);
- receipt hash:
  `7816f5fc69ffabceb63ffa0eb30e26202b36c6a156f464084e0b1c93e5890e87`;
- fixed-threshold held-out behavior remained weak:
  validation `3` true positives, `0` true negatives, `4` false positives, and
  `4` false negatives; test `2` true positives, `2` true negatives, `2` false
  positives, and `4` false negatives;
- validation/test present-box MAE and IoU lost to the M3AE-AJ median baseline,
  and the diagnostic threshold sweep selected no product threshold;
- failure classification:
  `heldout_presence_and_box_generalization_failure`;
- exact next action:
  `detector0_union_target_architecture_remediation`.

### M3AE-AO - Detector 0 Union-Target Architecture Remediation

Status: closed at session 260 / commit 9b5ea5d.

Goal: design, without training, the architecture/objective remediation needed
after M3AE-AN proved that the selected M3AE-AK/AL formulation fits train but
fails fixed-threshold held-out presence and box behavior.

Inputs:

1. M3AE-AN held-out behavior check receipt.
2. M3AE-AM held-out behavior check design artifact.
3. M3AE-AL architecture-microprobe receipt and row-level predictions.
4. M3AE-AK architecture-reformulation design artifact.
5. M3AE-AJ median-box diagnostic receipt.
6. Observer-249 API diagnostic.
7. Current approved Detector 0 packet and Tier 0 manifest identifiers/hashes.

Reviewable output:

1. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md).
2. Explain the train-fit versus held-out failure pattern, including non-table
   false positives outscoring missed `table` rows and validation/test box
   metrics losing to the M3AE-AJ median baseline.
3. Reject threshold/product-claim workarounds and define what a future
   architecture/objective remediation would change.
4. Record future gates and exactly one next action.

Hard stop: no microprobe rerun, Detector 0 training or training-smoke retry,
image/tensor payload load, packet mutation, row additions, Brev
sync/training/spend, crop-normalization ablation rerun, recognizer training,
label expansion, source approval/import, controlled clip-heldout evaluation,
broad route, export, model-card promotion, final-readiness claim, Brev stop,
duplicate worker, final-gate weakening, product-runtime code change, generated
pseudo-labels, schema weakening, threshold promotion, or pretrained
detector/landmark use in M3AE-AO.

Result:

- design artifact:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md);
- design hash:
  `57163e841f23abe00382c68d1a8f8b3f0c01d86497dce17bfa6f744d122eeaaf`;
- classification preserved:
  M3AE-AN remains the current held-out failure source of truth with
  `heldout_presence_and_box_generalization_failure` and no concrete data/schema
  invalidation;
- rejected workarounds:
  threshold selection, product-claim reduction by threshold, immediate
  crop-normalization ablation, recognizer training, broad evaluation, v1
  hyperparameter-only retry, median-only detector, packet mutation, pretrained
  routes, generated labels, Brev spend, export, promotion, and final-readiness
  claims;
- selected future remediation:
  `spatial_objectness_anchor_residual_union_target_microprobe_v2`, a bounded
  local scratch spatial objectness plus anchor-residual box objective over the
  same current approved packet;
- exact next action:
  `detector0_union_target_architecture_microprobe_v2`.

### M3AE-AP - Detector 0 Union-Target Architecture Microprobe V2

Status: closed at session 262 / commit 075afef; selected `stop_reduced_claim`.

Goal: run exactly one local no-spend microprobe for the M3AE-AO selected
`spatial_objectness_anchor_residual_union_target_microprobe_v2` formulation
over the current approved Detector 0 packet, then decide whether the lane has a
bounded path to crop-normalization work or must stop/reduce claim.

Inputs:

1. M3AE-AO architecture remediation design artifact.
2. M3AE-AN held-out behavior check receipt.
3. M3AE-AL architecture microprobe receipt and row-level predictions.
4. M3AE-AK architecture-reformulation design artifact.
5. M3AE-AJ median-box diagnostic receipt.
6. Observer-249 API diagnostic.
7. Current approved Detector 0 packet and Tier 0 manifest identifiers/hashes.

Reviewable output:

1. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json).
2. Record command, device, seed, architecture summary, input representation,
   objectness/box loss terms, row-level train/validation/test predictions,
   fixed-threshold presence behavior, per-row box errors and IoU, per-split
   metrics, and direct M3AE-AJ median-baseline comparison.
3. Apply strict train and held-out gates from the active prompt. If train gates
   fail, or if train fits but held-out behavior repeats M3AE-AN without concrete
   data/schema invalidation, select `stop_reduced_claim`.
4. Record no-pretrained/source/Brev boundaries and exactly one next action.

Hard stop: no generic Detector 0 training-smoke retry, packet mutation, row
additions, Brev sync/training/spend, crop-normalization ablation rerun,
recognizer training, label expansion, source approval/import, controlled
clip-heldout evaluation, broad route, export, model-card promotion,
final-readiness claim, Brev stop, duplicate worker, final-gate weakening,
product-runtime code change, generated pseudo-labels, product threshold
promotion, or pretrained detector/landmark use in M3AE-AP.

### M3AF - Reduced Product Claim

Status: closed at `1ca9590`; selected `stop_human_demo_review`.

Goal: package the smallest honest deadline path after M3AE-AP selected
`stop_reduced_claim`: a fail-closed, learn-only lesson/practice surface with no
trained-recognition or live-tracking claim.

Required subtasks:

1. Preserve M3AE-AP as the current ML evidence: train fit succeeded, held-out
   Detector 0 target presence failed, and no data/schema invalidation was found.
2. Verify the app's claim surfaces still say the recognizer and Detector 0 are
   not trained/promoted.
3. Inspect `/lesson` and `/` for misleading copy, auth/demo friction, tracking
   language, or correctness implications.
4. Make only scoped product or doc edits needed to support a reduced honest
   demo. Do not run training, export, source approval, or model promotion.
5. Write a reduced-claim validation artifact under `docs/validation/` with the
   supported demo path, unsupported claims, commands, Brev status, and exactly
   one next action.
6. Keep final-promotion negative-challenge gates separate from the reduced
   learn-only demo claim.

### M3AG - Human Demo Review And Polish

Status: closed at `7d24f07`; selected `stop_for_live_demo`.

Goal: review the reduced-claim app as a human demo surface and remove bounded
demo blockers without restarting ML work.

Required subtasks:

1. Preserve M3AF as the current claim source: learn-only demo, fail-closed
   model/tracker status, no training/export/source/promotion.
2. Inspect `/`, `/lesson`, and `/validation` for demo blockers: misleading
   copy, route friction, layout issues, broken local camera states, missing
   route links, or confusing evidence/status presentation.
3. Make only scoped product/copy/test/doc edits needed to remove one real demo
   blocker or clarify one review surface.
4. Use existing browser/smoke/audit surfaces rather than inventing a parallel
   proof.
5. Write a human-demo review artifact under `docs/validation/` with inspected
   paths, commands, pass/fail evidence, remaining blockers, Brev status, and
   exactly one next action.

Hard stop: no training, source approval/import, export, model-card promotion,
product threshold selection, final-readiness claim, or Brev compute.

### M3AH - Detector Ablation

Status: deferred until a future human-approved ML/data/source scope.

Goal: determine whether HandBoxNet improves a proven fixed-crop path.

Required subtasks:

1. Write or update a detector data/source artifact.
2. Train/evaluate HandBoxNet only with no-pretrained, source-reviewed box data.
3. Compare fixed crops versus detector crops on the same Tier 0/Tier 1 set.
4. Promote detector crops only if the ablation improves robustness and passes
   detector validation.

### M3AI - Reduced Product Final QA

Status: closed at `d13e53e` after executor commit `d2067c9`.

Goal: package the strongest honest reduced learn-only demo state after M3AH
proved the current PopSign-only Tier 0 recognizer lane was not promotable.

Exit evidence:

1. `/validation` and both claim matrices reflect M3AH failed-promotion evidence
   and the reduced product QA state.
2. `/`, `/lesson`, and `/validation` have refreshed smoke/static evidence.
3. The active browser model remains fail-closed: `model-card.status=not_trained`,
   browser recognition disabled, Detector 0 tracking disabled, and active CV
   labels empty.
4. Final reduced-demo receipt exists at
   [`docs/validation/return-to-form-reduced-demo-final-evidence-v1.json`](../validation/return-to-form-reduced-demo-final-evidence-v1.json).
5. Observer stop session 283 records the remaining human choices: accept
   reduced demo, choose a data/source path, authorize Brev provider action, or
   change scope.

### M3AJ - Approved Source Vocabulary Unblock

Status: closed at `a131a96`.

Goal: make the next ML/data path concrete by refreshing approved ASL Citizen
selected manifests, exporting strict lesson-milestone manifests, accepting only
reviewed ASL Citizen raw-video provenance in the training dry-run, and proving
the path with `--lesson-milestone --check-files --dry-run`.

Required subtasks:

1. Refresh
   `data/manifests/diagnostics/asl-citizen-selected/{train,validation,test}.json`
   with the current source-register hash. Completed with current
   source-register hash
   `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`.
2. Write lesson-milestone manifests at
   `data/manifests/lesson/rawframe-milestone/{train,validation,test}.json`
   with correct manifest-relative video paths and current source/import/review
   hashes. Completed; receipt:
   [`docs/validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json`](../validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json).
3. Patch `scripts/train_rawframe_model.py` so
   `asl-citizen-school-assignment-raw-videos` is accepted only with reviewed
   ASL Citizen school-assignment raw-video provenance fields. Completed for
   the reviewed selected raw-video fields and official archive URL.
4. Run strict dry-run validation with `--lesson-milestone --check-files
   --dry-run` and output dir `artifacts/rawframe-lesson-milestone`. Passed
   locally with no training.
5. Record an evidence package with manifest paths/hashes, dry-run output,
   audit commands, no-training/no-Brev/no-promotion boundaries, and exactly one
   next action. Session log 284 records the evidence and next action.

Hard stop: no training, Brev spend, source approval shortcut, unreviewed media
import, generated pseudo-labels, ONNX export, model-card promotion, threshold
promotion, broad 75/95-label retry, or final-readiness claim in M3AJ.

### M3AK - ASL Citizen Local Lesson Smoke

Status: stopped for human bounded Brev/full-training proposal decision after
local smoke completion at `39cedd0` and observer STOP `289`.

Goal: prove the actual local PyTorch training path can complete one bounded
lesson-milestone epoch on the approved ASL Citizen 25-label manifests before
any Brev spend or longer training run is authorized.

Required subtasks:

1. Confirm the exact M3AJ lesson manifests and evidence receipts are present:
   `data/manifests/lesson/rawframe-milestone/{train,validation,test}.json`,
   [`docs/validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json`](../validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json),
   and
   [`docs/validation/asl-citizen-selected-vocabulary-review-evidence.json`](../validation/asl-citizen-selected-vocabulary-review-evidence.json).
2. Run one local no-spend training smoke with
   `scripts/train_rawframe_model.py --lesson-milestone --check-files
   --epochs 1 --batch-size 4 --frame-count 12 --image-size 96` against the
   strict ASL Citizen lesson manifests and output dir
   `artifacts/rawframe-lesson-milestone`.
3. If the local smoke completes, parse
   `artifacts/rawframe-lesson-milestone/training-provenance.json`, record
   train/validation metrics, device, artifact hashes, and no-promotion
   boundaries in
   `docs/validation/return-to-form-asl-citizen-local-lesson-smoke-v1.json`.
4. If the local smoke fails because local PyTorch/MPS/CUDA or tensor loading is
   unavailable, write the exact blocker and the smallest bounded next action;
   do not switch to Brev inside this mission.
5. Run the loop/plan/source/no-pretrained/py-compile/diff validation commands
   from the active prompt, write a numbered session log, and commit only scoped
   prompt/evidence/code-doc files.

Hard stop: no Brev command, sync, spend, stop, reset, duplicate worker,
source import, source approval shortcut, generated pseudo-labels, pretrained
detector/landmark/backbone use, ONNX export, model-card promotion, threshold
selection, final-readiness claim, broad 75/95-label run, or push in M3AK.

Observer STOP note: the executor preserved the no-Brev/no-promotion boundary.
The observer applied the runbook's Brev default-off check after STOP; stop by
name, id, and `--all` returned, but `brev ls --json` still reported
`asl-pilot-rawframe-001` / `2hl1hytty` as `RUNNING`. Treat that as a human
provider/cost-control blocker, not approval for more remote work.

### M3AL - ASL Citizen Bounded Brev Training

Status: stopped after bounded remote training evidence at `106e091` and
observer STOP session 292.

Goal: use the already-running Brev A100 worker for one bounded full-training
and evaluation pass on the approved ASL Citizen 25-label lesson milestone,
then copy back artifacts and record teardown/provider state.

Required subtasks:

1. Confirm M3AK evidence exists:
   [`docs/session-logs/288-mission-3ak-local-training-smoke.md`](../session-logs/288-mission-3ak-local-training-smoke.md),
   [`docs/session-logs/289-observer-stop-local-training-smoke.md`](../session-logs/289-observer-stop-local-training-smoke.md),
   and
   [`docs/validation/return-to-form-asl-citizen-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-local-training-smoke-v1.json).
2. Record a compute receipt before remote work: `brev ls --json`, the matching
   observed A100 price from `brev search --gpu-name A100 --json`, planned
   command, max runtime, max spend, expected signal, and kill condition.
3. Sync the repo/data allowlist to `asl-pilot-rawframe-001`, including
   `data/manifests`, `data/tensors`, `data/external/asl-citizen/raw`,
   `data/external/cira-negative-challenge-videos/raw`, and
   `data/external/wikimedia-commons-negative-challenge-videos/raw`.
4. Prove remote `.venv`, torch, CUDA, ASL Citizen raw videos, decoded tensors,
   and negative-challenge media are present before training.
5. Run the active prompt's bounded `--lesson-milestone` remote training command
   with `timeout 5400s`, `motion_2d_temporal_cnn`, 40 epochs, batch size 16,
   frame count 12, image size 96, mild augmentation, and best-validation
   checkpoint selection; record the exact blocker if it fails.
6. If training completes, run `scripts/evaluate_rawframe_model.py
   --lesson-milestone` with `data/manifests/negative-challenge.json` and copy
   back `training-provenance.json`, `validation-report.json`,
   `calibrated-provenance.json`, `prediction-sidecar.json`, and the local-only
   `model_state.pt` hash.
7. Attempt Brev default-off after artifact copyback. If the worker still
   reports `RUNNING`, record the provider/cost-control blocker and STOP for
   human delete/reset/provider action; do not delete/reset autonomously.
8. Run loop/plan/source/no-pretrained/py-compile/sync-script/diff validation,
   write a numbered session log, and commit scoped evidence/doc/script changes.

Observer STOP note: `106e091` completed the compute receipt, sync/preflight,
remote CUDA dry run, capped 40-epoch A100 training, and artifact copyback. The
run fit the 300-clip train split (`final_train_accuracy=0.9966666666666667`)
but held-out validation stayed weak (`best_validation_accuracy=0.20212765957446807`,
final validation accuracy `0.1595744680851064`), so the result is not
promotable. Evaluation did not write test or negative-challenge metrics because
`data/manifests/negative-challenge.json` lacks required challenge-type
coverage. The executor and observer both attempted Brev default-off, but CLI
auth had expired and `brev ls --json`, `brev stop asl-pilot-rawframe-001`,
`brev stop 2hl1hytty`, and `brev stop --all` failed with logged-out EOF. No
further remote command is approved until a human restores provider/CLI stop
control and chooses between negative-challenge coverage repair/evaluation,
research/architecture diagnosis, or parking ML.

Hard stop: no duplicate Brev worker, worker delete/reset, source approval
shortcut, generated pseudo-labels, pretrained detector/landmark/backbone use,
ONNX export, model-card promotion, threshold promotion, browser activation,
final-readiness claim, broad 75/95-label run, destructive reset, amend, push,
or second speculative training retry without observer escalation.

### M3AM - ASL Citizen Generalization Diagnosis

Status: completed in session 294; observer CONTINUE recorded at `e732611`.

Goal: diagnose the M3AL checkpoint's generalization failure from existing local
artifacts and select exactly one bounded no-spend next action before any more
training or Brev work.

Required subtasks:

1. Read the M3AL training receipt, M3AM core-negative diagnostic receipt, local
   validation report, and prediction sidecar.
2. Produce a tracked diagnosis artifact under `docs/validation/` that records
   train/validation/test gap, low/zero-recall classes, high-confidence wrong
   predictions, signer-level accuracy spread, and whether the current blocker
   is data support, crop/region information, architecture/regularization,
   label semantics, source domain, or inconclusive.
3. Use `openai-api-research` or `gpt-pro-research` for a short strategy memo if
   local evidence is inconclusive or the executor proposes another
   training-style retry.
4. Select exactly one next action from:
   `reduce_to_high_signal_5_10_sign_module`,
   `detector0_or_region_crop_diagnostic_design`,
   `first_party_capture_or_user_calibration_packet`,
   `phonology_or_label_semantics_review`, or
   `park_ml_and_ship_reduced_fail_closed_product`.
5. Update this tactical overlay and, if needed, write the next bounded
   per-milestone prompt.
6. Run local audits, write a numbered session log, and commit scoped evidence
   and prompt changes.

Result:

- diagnosis artifact:
  [`docs/validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json`](../validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json);
- classification: `data_split_support`, with secondary
  `architecture_capacity_or_regularization` and `source_domain` hypotheses;
- blocker: positive-class signer-disjoint generalization, not GPU availability
  and not the current five-type core-negative gate;
- labels with nonzero recall on both validation and test: `table`, `white`,
  `please`, `sad`, `black`, `hello`, and `uncle`;
- research escalation: not used because local evidence clearly selected a
  non-training downscope action and no broad training retry is proposed;
- exact next action:
  `reduce_to_high_signal_5_10_sign_module`;
- next bounded prompt:
  [`docs/model/return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md).

Hard stop: no Brev sync/exec/training/spend, classifier/detector training,
source import, pseudo-label generation, pretrained component, ONNX export,
threshold promotion, model-card promotion, browser activation, final-readiness
claim, push, worker delete, or worker reset in M3AM.

### M3AN - ASL Citizen High-Signal Module Selection

Status: closed in session 296; observer CONTINUE at `efe3f82`.

Goal: reduce the failed 25-label ASL Citizen lesson milestone to the smallest
defensible 5-10 sign module before any more classifier training or Brev work.

Active prompt:
[`docs/model/return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md).

Required subtasks:

1. Use the M3AM diagnosis and existing ASL Citizen manifests; do not rerun
   training or import sources.
2. Rank all 25 labels by validation/test recall and F1, source support, signer
   coverage, known confusion risks, and learner-module usefulness.
3. Select a high-signal 5-10 sign module only if the evidence supports it. If
   fewer than five labels are defensible, record the blocker instead of
   padding the module.
4. Write
   [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json)
   with selected/rejected labels, support, held-out metrics, signer coverage,
   confusion risks, future smoke gates, and no-spend/no-pretrained boundaries.
5. Update this tactical overlay with the selected module and exactly one next
   action.
6. Run local audits, write a numbered session log, and commit scoped evidence
   and prompt changes.

Result:

- module selection artifact:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json);
- selected module: `table`, `please`, `black`, `hello`, `uncle`, `white`,
  and `sad`;
- selection rule: nonzero recall on both signer-disjoint validation and
  signer-disjoint test; repo hint metadata was only a weak tie-breaker;
- rejected labels: `apple`, `aunt`, `bird`, `book`, `brother`, `brown`,
  `frog`, `man`, `no`, `orange`, `read`, `sick`, `thank_you`, `think`,
  `thirsty`, `who`, `why`, and `yes`;
- exact next action:
  `materialize_high_signal_module_manifests_and_gates`;
- next bounded prompt:
  [`docs/model/return-to-form-asl-citizen-high-signal-manifest-gates-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-manifest-gates-goal-loop-prompt.md).

Hard stop: no Brev sync/exec/training/spend, classifier/detector training,
source import, pseudo-label generation, pretrained component, ONNX export,
threshold promotion, model-card promotion, browser activation,
final-readiness claim, push, worker delete, or worker reset in M3AN.

### M3AO - ASL Citizen High-Signal Manifest Gates

Status: closed in session 298; observer CONTINUE at `5257dc8`.

Goal: materialize the seven-label M3AN selection into reduced
train/validation/test manifests and a gate receipt before any reduced-module
training command is allowed.

Active prompt:
[`docs/model/return-to-form-asl-citizen-high-signal-manifest-gates-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-manifest-gates-goal-loop-prompt.md).

Required subtasks:

1. Use the M3AN selection artifact and existing strict ASL Citizen lesson
   manifests; do not rerun training or import sources.
2. Generate reduced manifests under
   `data/manifests/lesson/high-signal-module/` for only `table`, `please`,
   `black`, `hello`, `uncle`, `white`, and `sad`.
3. Preserve source, clip, signer, tensor, and decode provenance from the parent
   manifests.
4. Write
   [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json)
   with counts, hashes, provenance proof, script-contract status, local gates,
   hard boundaries, blockers if any, and exactly one next action.
5. If reduced-module dry-run support is blocked or semantically ambiguous,
   record that as a script-contract blocker and select one no-training
   remediation action.
6. Update this tactical overlay with the reduced manifest receipt and exactly
   one next action.
7. Run local audits, write a numbered session log, and commit scoped evidence,
   manifest, and doc files.

Result:

- reduced manifests:
  `data/manifests/lesson/high-signal-module/{train,validation,test}.json`;
- manifest/gate receipt:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json);
- reduced vocabulary evidence:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-vocabulary-review-evidence-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-vocabulary-review-evidence-v1.json);
- counts: train 84 clips / 19 signers, validation 27 clips / 5 signers, test
  28 clips / 7 signers;
- provenance: reduced clips are exact parent manifest clip objects, use only
  `asl-citizen-school-assignment-raw-videos`, retain tensor paths/hashes and
  decode provenance, and remain signer-disjoint across splits;
- script-contract blocker: current `scripts/train_rawframe_model.py` has no
  honest reduced real-data dry-run mode, and the attempted no-training dry-run
  exits with `Manifest validation failed: final training requires --train-manifest data/manifests/train.json`;
- exact next action:
  `add_reduced_real_data_manifest_contract`;
- next bounded prompt:
  [`docs/model/return-to-form-asl-citizen-reduced-real-data-contract-goal-loop-prompt.md`](return-to-form-asl-citizen-reduced-real-data-contract-goal-loop-prompt.md).

Hard stop: no Brev sync/exec/training/spend, classifier/detector training,
source import, pseudo-label generation, pretrained component, ONNX export,
threshold promotion, model-card promotion, browser activation,
final-readiness claim, push, worker delete, or worker reset in M3AO.

### M3AP - ASL Citizen Reduced Real-Data Contract

Status: completed in session 300; observer STOP in session 301 at `e35d642`.

Goal: add an explicit no-training script contract for the seven-label real ASL
Citizen reduced module so future dry-runs do not misuse
`--allow-small-label-set`, and so the reduced module remains distinct from
strict 25-label lesson-milestone evidence and final 75-100 label evidence.

Active prompt:
[`docs/model/return-to-form-asl-citizen-reduced-real-data-contract-goal-loop-prompt.md`](return-to-form-asl-citizen-reduced-real-data-contract-goal-loop-prompt.md).

Result:

- script contract: `scripts/train_rawframe_model.py` now has a distinct
  `--reduced-real-data-module` no-training validation mode;
- contract receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json`](../validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json);
- validated command: high-signal train/validation/test manifests pass
  `--reduced-real-data-module --check-files --dry-run` with
  `evidence_mode=reduced_real_data_module` and `training_status=dry_run_only`;
- guardrails: the mode rejects non-`--dry-run` execution and rejects combining
  with `--allow-small-label-set`;
- preserved gates: exact high-signal manifest paths, ASL Citizen source id,
  5-10 label bound, signer-disjoint splits, raw-video hashes, decoded tensor
  hashes, retained decode-provenance metadata, no-pretrained token checks,
  strict 25-label lesson gate, final 75-100 gate, and full 17-type hard-negative
  gate;
- exact next action:
  `stop_for_reduced_module_training_scope_decision`.

Hard stop: no Brev sync/exec/training/spend, classifier/detector training,
source import, pseudo-label generation, pretrained component, ONNX export,
threshold promotion, model-card promotion, browser activation,
final-readiness claim, push, worker delete, or worker reset in M3AP.

### M3AQ - ASL Citizen Reduced Module Local Training Smoke

Status: completed.

Goal: add and run the first honest no-spend model-learning slice for the
seven-label ASL Citizen high-signal module. The slice must train from random
initialization through a distinct reduced-module training-smoke contract, not
through `--allow-small-label-set` or the no-training
`--reduced-real-data-module` validation flag.

Active prompt:
[`docs/model/return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md`](return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md).

Starting evidence:

- M3AP contract receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json`](../validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json);
- high-signal manifests:
  `data/manifests/lesson/high-signal-module/{train,validation,test}.json`;
- high-signal module labels: `table`, `please`, `black`, `hello`, `uncle`,
  `white`, and `sad`;
- split counts: train 84 clips / 19 signers, validation 27 clips / 5 signers,
  test 28 clips / 7 signers;
- local environment check: `.venv/bin/python` imports `torch 2.12.0` and MPS
  is available;
- Brev blocker: `brev ls --json` currently fails at the login prompt with EOF,
  so this active slice is local/no-spend only.

Required result:

- add a distinct reduced-module training-smoke mode in
  `scripts/train_rawframe_model.py`;
- dry-run/check-files must pass against the exact high-signal manifests;
- one bounded local MPS training smoke should run if the new contract and local
  environment support it;
- binary outputs must stay under ignored `output/`;
- a tracked receipt under `docs/validation/` must record metrics or exact
  blocker, command output, hashes, no-pretrained evidence, Brev auth state if
  checked, and exactly one next action.

Result:

- script contracts: `scripts/train_rawframe_model.py` now exposes
  `--reduced-real-data-training-smoke` for bounded local MPS training, and
  `scripts/evaluate_rawframe_model.py` now exposes the same evidence mode for
  validation/test metrics without promotion;
- contract receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json)
  (`sha256=d5e7ba6069c3165e3b49bc454495563425cad0a276c663bfef457873e17156f8`);
- dry-run/check-files result: exact high-signal train/validation/test manifests
  passed with `evidence_mode=reduced_real_data_training_smoke`, `label_count=7`,
  and split counts `84/27/28`;
- local training result: `.venv/bin/python` / PyTorch `2.12.0` ran on MPS for
  3 epochs from random initialization, selected epoch 3 by best validation,
  and wrote ignored local artifacts under
  `output/m3aq-reduced-module-local-smoke/`;
- training metrics: epoch 3 train accuracy `0.4642857142857143`, validation
  accuracy `0.25925925925925924`, validation loss `2.2884716016274913`;
- evaluation metrics: validation top-1 `0.25925925925925924`, validation
  macro-F1 `0.19480519480519481`, test top-1 `0.21428571428571427`,
  test macro-F1 `0.12558869701726846`, threshold `0.67`, test false-pass rate
  `0.03571428571428571`;
- finality: not final 75-100-label evidence, not 25-sign lesson evidence, no
  negative-challenge manifest was evaluated, and no calibrated provenance,
  ONNX export, model-card promotion, browser activation, or final-readiness
  claim was made;
- exact next action: `stop_for_reduced_module_training_smoke_review`.

Hard stop: no Brev sync/exec/training/spend, Detector 0 training, source
import, pseudo-label generation, pretrained component, ONNX export, threshold
promotion, model-card promotion, browser activation, final-readiness claim,
push, worker delete, or worker reset in M3AQ.

### M3AR - Overnight Recovery And Brev Unblock

Status: active; first recovery slice complete.

Goal: recover the overnight path after the weak M3AQ reduced-module smoke by
checking Brev auth/cost control, testing the interactive product, and writing
one evidence-backed route decision before any more training-style retry.

Active prompt:
[`docs/model/return-to-form-overnight-recovery-and-brev-unblock-goal-loop-prompt.md`](return-to-form-overnight-recovery-and-brev-unblock-goal-loop-prompt.md).

Starting evidence:

- M3AQ receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json);
- M3AQ result: train accuracy `0.4642857142857143`, validation accuracy
  `0.25925925925925924`, test top-1 `0.21428571428571427`, and test macro-F1
  `0.12558869701726846`, with no negative challenge, no threshold promotion,
  no ONNX/browser/model-card activation, and no final-readiness evidence;
- Brev state: `brev ls --json` currently fails at the login prompt with EOF;
  `brev login --skip-browser` has opened a browser NVIDIA security-code
  challenge that requires human 2FA before CLI auth can be restored;
- retained Detector 0 evidence: coarse localization/crop normalization remains
  architecturally relevant, but
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
  selected reducing the Detector 0 claim because no bounded no-new-source
  union-target path remained justified;
- user compute intent: the overnight push may use the existing Brev balance
  plus up to about `$150` more only after auth is restored, route/cost are
  logged, duplicate workers are avoided, and idle GPU state is stopped.

Required result:

- classify current Brev auth/cost-control state and, if auth is restored,
  inspect the existing worker before any training;
- write
  `docs/validation/return-to-form-overnight-recovery-decision-v1.json`
  comparing ASL Citizen continuation, PopSign/Tier-0 continuation, fixed-crop
  CNN+TCN contract work, Detector 0/landmark decomposition, SemLex/phonology,
  and product-first interactive finish;
- run `web` typecheck/build and smoke `/`, `/lesson`, and `/validation` with a
  browser or Playwright, fixing only scoped high-impact product bugs;
- if and only if Brev auth is restored and the decision receipt selects a
  bounded GPU run, launch a single logged job with copyback, evaluation, and
  worker stop verification;
- update this tactical overlay with exactly one next action.

Result:

- Brev state: `brev ls --json` still fails at logged-out prompt EOF, so
  worker inspection and paid compute remain blocked on human NVIDIA 2FA;
- route decision receipt:
  [`docs/validation/return-to-form-overnight-recovery-decision-v1.json`](../validation/return-to-form-overnight-recovery-decision-v1.json)
  (`sha256=58043f89e213f1f4f535c32e3a248f470f71aceaf7f02774710cddca585a9f42`);
- selected route: product-first interactive finish, because ASL Citizen and
  PopSign recognizer evidence remains weak/non-promotable and Brev auth blocks
  paid worker inspection;
- product QA: `npm --prefix web run typecheck`, `npm --prefix web run build`,
  `/`, `/lesson`, and `/validation` HTTP/browser smokes passed on
  `http://localhost:3001`;
- scoped product fix: regenerated the reviewer claim matrices so `/validation`
  shows Mission 3AR and M3AQ weak-metric evidence instead of stale Mission 3AI
  current-state copy, while keeping `active_cv_claim=null`, browser model
  `not_trained`, and final gates unchanged;
- exact next action: `continue_product_first_fail_closed_demo_polish_no_spend`.

Hard stop: no duplicate Brev worker, worker delete/reset, unbounded paid run,
source import, generated pseudo-label, pretrained promoted-lane dependency,
model-card promotion, browser trained activation, final-readiness claim,
final-gate weakening, or push in M3AR.

## Observer Transition Rules

- CONTINUE only to the next listed milestone or to the next unfinished subtask
  inside the current milestone.
- NUDGE only when the executor missed a listed subtask or evidence field.
- REDIRECT only when evidence invalidates the current milestone assumptions or
  the user changes direction.
- STOP when the next action requires new paid spend, new source approval,
  external credentials, final-gate changes, or human sign/data collection.
- ESCALATE when the plan spine itself needs changing.
- Brev defaults off. When the loop is stopped, when no remote command is
  planned, or when a receipt selects `stop_reduced_claim`, the observer or
  executor should check for active remote training, run `brev stop
  asl-pilot-rawframe-001`, and verify the workspace no longer reports
  `RUNNING`. If stop verification fails, log it as a human cost-control
  blocker; do not delete/reset without explicit user approval.

The observer must preserve the milestone ladder unless the user explicitly
authorizes a new ladder.

## Original Plan Spine

1. **Source and annotation review comes before training.**
   - SemLex / ASL-LEX phonology and ASL Citizen linkage are candidate sources,
     not assumed approvals. Before use, add or update source-register evidence,
     run `node scripts/audit_source_register.mjs`, and write a vocabulary
     overlap artifact under `docs/research/`.
   - Public or academic datasets may enter model training only through an exact
     source-register decision. Broad source ids remain disallowed unless the
     register says otherwise.

2. **Use a fixed controlled crop protocol for the first learnability proof.**
   - The first proof uses controlled framing / fixed regions: left hand, right
     hand, upper-body/signing-space context, and optional head region.
   - A scratch detector is a robustness improvement, not a prerequisite for
     the first proof.
   - Record the crop protocol in a committed crop config before training.

3. **Decompose the recognizer before scaling labels.**
   - The target architecture remains from-scratch and no-pretrained.
   - The original shape is region-aware: left-hand crop encoder, right-hand
     crop encoder, posture/signing-space encoder, optional head/NMM encoder,
     and a small temporal model over 16-32 frames.
   - A simpler fixed-crop raw-frame baseline may stand in for this only as a
     5-10 sign learnability proof. It must not be escalated to 75/95 labels
     until the small proof is learning.

4. **Train by downscope ladder, not by broad retries.**
   - Tier 0: 5 signs, sanity/easy split, expected to learn quickly.
   - Tier 1: 5-10 signs, signer-disjoint or best-available honest split.
   - Tier 2: 10-20 signs only after Tier 1 passes.
   - Tier 3+: 40/80/95 signs only after smaller tiers demonstrate real
     learning and calibrated rejection.

5. **Detector work is gated by evidence.**
   - HandBoxNet / Detector 0 may run in parallel only after fixed-crop evidence
     exists or after a concrete crop-quality failure is recorded.
   - M3AE-I/J/K now satisfy this gate: the crop-identity-preserving path can
     memorize the train split, but signer-disjoint validation/test remain near
     random and the M3AE-K split diagnostic found no manifest leakage.
   - Detector crops become primary only after fixed-vs-detector ablation shows
     an improvement and detector validation passes.

6. **Validation gates are set before training.**
   - For a 5-10 sign proof, target top-1 / macro recall, hard-negative FAR,
     and zero-accepted-true-class checks must be written before training.
   - If gates fail, record metrics and decide whether to downscope, improve
     data/crops, or stop. Do not expand label count after a failed proof.

## Mutable Tactical Overlay

### Current Branch Diagnosis

The broad 95-label raw-frame path is paused. Recent PopSign-only and
PopSign-plus-WLASL controlled clip-heldout runs improved provenance and tensor
plumbing, but did not show useful learning. The latest controlled clip-heldout
training provenance records validation accuracy near chance for 95 labels, so
continuing broad evaluation/retraining is not the active path.

The checkpoint and WLASL remediation artifacts remain retained evidence. They
are not the next training objective, and they must not be promoted or used to
justify further broad runs without a user-approved redirect.

### Active Return-To-Form Objective

Return the repo to a predictable 5-10 sign composable proof:

1. Freeze broad 75/95-label model work.
2. Reconcile `GOAL.md`, `README.md`, `MVP_TASKS.md`, and
   `docs/model/dataset-and-training-plan.md` to this plan.
3. Add an audit that catches stale Mission 3R / broad-run steering.
4. Choose a 5-10 sign set, verify source and optional phonology coverage, write
   a fixed crop config, and run bounded learnability probes before scaling.
5. After M3AE-I/J/K fixed-crop evidence, bootstrap scratch Detector 0 /
   crop-normalization as the next composable subproblem before any more
   classifier tuning.

### Current Milestone

M3IV - Detector 0 landmark training packet authority gap review.

The latest active prompt is
[`docs/model/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-goal-loop-prompt.md`](return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-goal-loop-prompt.md).
Older evidence below remains retained context, but the pair should not resume
M3IU readiness planning, M3IQ/M3IR/M3IS card/contract planning, broad fitting,
or Brev compute from this section.

Current evidence:

- M3IT result: commit `c401e4e` completed one local/no-remote/no-Brev/
  no-labeling/no-training/no-promotion static recognizer landmark-sequence
  plan. It created
  [`docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`](return-to-form-recognizer-landmark-sequence-plan-v1.json),
  [`docs/validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json`](../validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json),
  and
  [`docs/session-logs/815-mission-3it-recognizer-landmark-sequence-plan.md`](../session-logs/815-mission-3it-recognizer-landmark-sequence-plan.md).
  It preserved fail-closed claim surfaces and selected
  `continue_m3iu_detector0_landmark_training_packet_readiness_plan`.
- M3IU objective: write a static Detector 0 region + hand-landmark
  training-packet readiness plan from M3IQ/M3IR/M3IS/M3IT evidence. M3IU must
  not import source/media, run MediaPipe or labeling, create authoritative
  labels/tensors/checkpoints, train/evaluate, start or stop Brev, export,
  promote, activate browser recognition, alter final gates, or expand claims.
- M3IU result: commit `a1a4325` completed one local/no-remote/no-Brev/
  no-labeling/no-training/no-promotion static readiness plan. It created
  [`docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json`](return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json),
  [`docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json`](../validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json),
  and
  [`docs/session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md`](../session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md).
  It recorded that the future packet is not training-ready and selected
  `continue_m3iv_detector0_landmark_training_packet_authority_gap_review`.
- M3IV objective: review current source-register and offline-label authority
  evidence for a future Detector 0 region + hand-landmark training packet
  without importing sources, approving sources, generating labels, materializing
  packets, training, evaluating, starting Brev, exporting, promoting, activating
  browser recognition, altering final gates, or expanding claims.

- M3DU result: commit `bc0f3d3` completed the single approved bounded Brev
  smoke after the input-contract fix. The dry-run passed, exactly one timed
  CUDA training command completed, evaluation/copyback ran, and ignored local
  artifacts were copied under `output/m3dq-high-signal-region-grid-tcn-brev/`.
  Metrics are weak and not promotable: validation top-1 `0.2593`, validation
  macro-F1 `0.1536`, test top-1 `0.1786`, test macro-F1 `0.0978`, selected
  threshold `0.28`, and test false-pass rate `0.0357`. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json)
  selects `continue_m3dq_metric_triage_no_remote`.
- M3DV result: commit `85fe13b` completed a local/no-spend metric triage. It
  classified M3DU as an operational CUDA path with weak held-out
  generalization, prediction collapse mostly to `white`/`uncle`, and five
  zero-recall test labels. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json)
  selected `stop_for_human_cost_control_review`.
- Observer 485 committed `fb0a90d` as a STOP because Brev stop attempts by
  name, id, and `--all` returned while the provider still reported
  `asl-pilot-rawframe-001` / `2hl1hytty` as `RUNNING`, `READY`, and
  `HEALTHY`.
- The latest supervising user instruction explicitly asked to continue the
  overnight completion push and unblock Brev usage. The stale worker was then
  diagnosed as a non-stoppable MassedCompute A100 instance with no active
  training process and local output mirrors present. The supervisor ran
  `brev delete asl-pilot-rawframe-001`; current `brev ls --json` reports
  `"workspaces": null`. Receipt:
  [`docs/validation/return-to-form-brev-nonstoppable-worker-delete-v1.json`](../validation/return-to-form-brev-nonstoppable-worker-delete-v1.json).
- The root-cause receipt
  [`docs/validation/return-to-form-dataset-training-root-cause-v1.json`](../validation/return-to-form-dataset-training-root-cause-v1.json)
  says the primary current blocker is coarse ROI/crop localization and
  crop-inclusion evidence. It does not support full hand/posture/face landmarks
  as the immediate blocker, although manually approved scratch landmark-style
  supervision may remain future robustness work.
- M3DW was superseded before execution by a more direct detector/landmark
  question from the current objective. M3DX answered that question locally.
- M3DX result: commit `65dfc8e` completed one local/no-spend source-feasibility
  packet for scratch hand landmarks and wrote
  [`docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json`](../validation/return-to-form-hand-landmark-source-feasibility-v1.json).
  It found a scratch hand-landmark route technically plausible from public
  manual/human-in-loop sources, but blocked any material next step on explicit
  human source/license/import approval. Observer 489 committed `41f4b33` as a
  STOP for that approval. No source approval is granted by the next route.
- The Detector 0 held-out recall receipt
  [`docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json`](../validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json)
  selected `fix_detector0_presence_objectness_formulation_no_brev` and
  classified the local blocker as
  `target_objectness_formulation_deficiency_remains`.
- M3DY result: commit `c3a6d99` completed one local/no-Brev/no-source-import
  Detector 0 objectness diagnostic and wrote
  [`docs/validation/return-to-form-detector0-objectness-repair-v1.json`](../validation/return-to-form-detector0-objectness-repair-v1.json).
  The receipt found the approved packet label-confounded for objectness: all
  target-present rows are `table`, all target-absent rows are different
  labels, and there is no within-label present/absent contrast. It selected
  `continue_detector0_annotation_or_packet_support_no_brev`, not crop
  normalization ablation.
- M3DZ result: commit `0d94323` completed one local/no-Brev/no-source-import
  Detector 0 packet-support diagnosis and wrote
  [`docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json`](../validation/return-to-form-detector0-packet-support-diagnosis-v1.json).
  The receipt found a no-source local packet mutation is possible from existing
  approved tensor-ready PopSign clips, but it requires explicit target-scope
  and annotation-budget decisions before mutating rows. Observer 494 committed
  `00cc5b1` as a STOP for that approval.
- M3EA result: commit `d4b262d` completed one local/no-Brev/no-source-import/
  no-packet-mutation Detector 0 target-formulation probe and wrote
  [`docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json`](../validation/return-to-form-detector0-class-invariant-target-probe-v1.json).
  The receipt found the class-invariant targets are all-present, so row-level
  presence is not meaningful, and no held-out selected-cell dynamic-localization
  candidate beat the fixed/median geometry path. It selected
  `prepare_detector0_fixed_geometric_fallback_no_brev`.
- M3EB result: commit `d9b4106` completed one local/no-Brev/no-training
  fixed-geometric fallback packet and wrote
  [`docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json`](../validation/return-to-form-detector0-fixed-geometric-fallback-v1.json).
  It selected `prepare_fixed_geometric_crop_normalization_smoke_no_brev` after
  finding the `upper_body_or_signing_space` train-median box
  `[0.2, 0.08, 0.82, 0.98]` is stable on held-out packet rows. The receipt
  keeps fixed geometry separate from runtime Detector 0 objectness, browser
  recognition, ASL correctness, and final readiness claims.
- M3EC result: commit `3e254c4` completed one local/no-Brev/no-training
  fixed-geometric crop-normalization smoke and wrote
  [`docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json`](../validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json).
  It selected `fixed_geometry_claim_reduction` after verifying all 345
  manifest-referenced tensor hashes and showing exact M3EB ROI is deterministic
  and applicable, but too narrow for unqualified interaction-preservation
  claims: left-hand full containment `0.34375`, table union/contact full
  containment `0.15`, versus `0.85` table union/contact containment for the
  existing broader materialized upper-body region.
- M3ED result: commit `9719b9a` completed one local/no-Brev/no-training
  fixed-geometric claim-reduction packet and wrote
  [`docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json`](../validation/return-to-form-fixed-geometric-claim-reduction-v1.json).
  It selected `fixed_geometry_materialized_region_followup_no_brev` after
  reducing exact M3EB ROI to deterministic diagnostic/accounting evidence
  only. Existing materialized `upper_body_signing_space` remains a bounded
  local follow-up candidate because it contains table union/contact boxes at
  `0.85` and right-hand boxes at `1.0`, without creating product, browser, ASL
  correctness, runtime Detector 0, or final-readiness authority.
- M3EE result: commit `453cdba` completed one local/no-Brev/no-training
  materialized-region accounting packet and wrote
  [`docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json`](../validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json).
  It selected `materialized_region_model_input_diagnostic_no_brev` after
  hash-verifying all 345 approved manifest tensors, confirming the expected
  materialized region order, and recording nonblank/distinct input statistics
  for `upper_body_signing_space`, `head_context`, and
  `full_frame_reference`.
- M3EF result: commit `4b0fd84` completed one local/no-Brev random-init
  no-artifact model-input diagnostic and wrote
  [`docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json`](../validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json).
  It selected `escalate_model_input_strategy_research`. The materialized
  upper-body/head arm was not materially worse than full-frame, but neither arm
  passed train sanity and predictions remained collapsed, so another
  autonomous training-style retry is not justified without strategy review.
- Observer 508 result: API research artifacts under
  [`artifacts/research/observer-508-m3ef-model-input-strategy/`](../../artifacts/research/observer-508-m3ef-model-input-strategy/)
  recommend `redirect_to_downscope`: write a no-training strategy/downscope
  packet rather than approving another autonomous fitting run.
- active M3EG prompt:
  [`docs/model/return-to-form-post-m3ef-model-input-strategy-downscope-goal-loop-prompt.md`](return-to-form-post-m3ef-model-input-strategy-downscope-goal-loop-prompt.md);
- selected M3EG slice: one local/no-Brev/no-training strategy packet that binds
  M3EF and observer 508 evidence to a conservative next action, preserves
  fail-closed browser/model claims, and records the human-approval or
  new-evidence gate required before any future training, source/data mutation,
  Brev/GPU work, export, promotion, or browser activation.
- hard boundary: no Brev command, remote compute, hand-landmark source import,
  source-register mutation, media download, manifest/tracked-tensor/vocabulary
  mutation, packet-row mutation, training/fitting retry, broad recognizer
  retraining, architecture search, hyperparameter sweep, checkpoint or promoted
  model artifact, broad labels, landmark detector training, pretrained
  detector/landmark/backbone/pseudo-label path, export, promotion, browser
  activation, product runtime change, final readiness or ASL-correctness claim,
  raw learner video upload, push, exact-M3EB-ROI unqualified
  interaction-preservation claim, or blind M3DQ rerun.

Earlier evidence:

- M3DQ result: commit `cddcfa7` completed the bounded compute-approved Brev
  smoke attempt through the remote dry-run gate. The dry-run failed before
  training because `--region-grid-tcn-training-smoke` still allows only
  `output/m3aw-region-grid-tcn-local-smoke` and
  `output/m3dm-high-signal-region-grid-tcn-brev`, while the active M3DQ prompt
  used `output/m3dq-high-signal-region-grid-tcn-brev`. No timed training,
  checkpoint, provenance, evaluation, copyback, or model artifact was produced.
  Receipt:
  [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json).
- M3DK result: commit `c243503` completed the authorized local/no-spend,
  no-training fail-closed product status refresh. The tracked receipt is
  [`docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json`](../validation/return-to-form-fail-closed-product-status-refresh-v1.json);
- M3DK updated `scripts/audit_final_claim_matrix.mjs` and regenerated
  `web/public/model/claim-matrix.json` plus
  `docs/validation/final-claim-matrix.json` so `/validation` now sees Mission
  3DK, M3DI/M3DJ non-recognition redirect, and observer 459 Brev
  stop-verification failure instead of stale Mission 3AR/Brev-login wording;
- M3DK preserved fail-closed browser claims:
  `status=no_active_claim_rawframe_not_trained`, `active_cv_claim=null`,
  `cv_supported_count=0`, `learn_only_count=100`, model-card
  `status=not_trained`, active vocabulary `activeLabels=[]`, and browser
  bundle recognition disabled;
- M3DK did not hand-edit `web/public/model/model-card.json`. Its stale
  provenance-note wording remains a recorded blocker because the active prompt
  forbade model-card hand edits and no generator path safely owned that field;
- Brev cost-control remains unresolved: observer 459 found no training process
  and ran `brev stop asl-pilot-rawframe-001`, `brev stop 2hl1hytty`, and
  `brev stop --all`, but `brev ls --json` still reported the A100 workspace
  `RUNNING`, `READY`, and `HEALTHY`. Do not run Brev for product work;
- active M3DL prompt:
  [`docs/model/return-to-form-fail-closed-product-smoke-refresh-goal-loop-prompt.md`](return-to-form-fail-closed-product-smoke-refresh-goal-loop-prompt.md);
- M3DL required receipt:
  [`docs/validation/return-to-form-fail-closed-product-smoke-refresh-v1.json`](../validation/return-to-form-fail-closed-product-smoke-refresh-v1.json);
- M3DL objective: complete exactly one local/no-spend, no-training fail-closed
  product smoke refresh for `/`, `/lesson`, and `/validation`; inspect product
  route and claim surfaces read-only; confirm the refreshed M3DK matrices are
  current; preserve browser fail-closed claims; avoid model-card hand edits;
  prove negative authorizations; and select exactly one next action;
- exact M3DL next action choices:
  `continue_fail_closed_product_smoke_refresh`,
  `continue_single_fail_closed_product_blocker_fix`,
  `draft_final_fail_closed_demo_evidence_package`,
  or `stop_for_human_product_or_cost_control_review`;

- latest user direction on 2026-05-27 supersedes the M3BM no-ML product-only
  fallback. The active question is now what specific source/data/schema/split/
  crop/model/compute blocker prevents SemLex / ASL-LEX, PopSign, ASL Citizen,
  Detector 0, or region-grid evidence from supporting a successful
  scratch-trained recognizer attempt;
- active M3BN prompt:
  [`docs/model/return-to-form-dataset-training-root-cause-goal-loop-prompt.md`](return-to-form-dataset-training-root-cause-goal-loop-prompt.md);
- M3BN required receipt:
  [`docs/validation/return-to-form-dataset-training-root-cause-v1.json`](../validation/return-to-form-dataset-training-root-cause-v1.json);
- M3BN result: commit `0ce6739` completed the authorized local/no-spend
  root-cause diagnosis. It inventoried PopSign, ASL Citizen, SemLex/ASL-LEX,
  Detector 0 / crop-normalization, and region-grid training evidence; found no
  supported current training attempt; classified missing full hand/posture/face
  landmarks as future robustness work rather than the current required blocker;
  and identified missing repaired crop/ROI evidence as the next blocker to
  change;
- exact next action choices:
  `continue_dataset_training_contract_repair`,
  `continue_manual_or_source_repair_packet`,
  `continue_detector_or_crop_contract_repair`,
  `continue_bounded_local_training_probe`,
  `continue_bounded_brev_training_receipt`,
  `escalate_strategy_research_with_local_evidence`,
  `stop_for_human_source_or_annotation_approval`, or
  `stop_until_supported_training_data_exists`;
- M3BN selected next action:
  `continue_detector_or_crop_contract_repair`;
- active M3BO prompt:
  [`docs/model/return-to-form-asl-citizen-high-signal-crop-roi-contract-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-crop-roi-contract-goal-loop-prompt.md);
- M3BO required receipt:
  [`docs/validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json`](../validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json);
- M3BO objective: complete exactly one local/no-spend, no-training crop/ROI
  contract for the ASL Citizen high-signal region-grid route. The contract must
  classify per-label/per-split crop inclusion or drift from existing
  manifest-bound evidence, decide whether a nonempty retained subset exists
  before training, identify whether a small reviewed coarse-ROI packet or
  crop-config repair is needed, and choose exactly one next action;
- exact M3BO next action choices:
  `continue_manual_coarse_roi_packet`,
  `continue_crop_config_repair_contract`,
  `continue_bounded_local_training_receipt`,
  `continue_bounded_brev_training_receipt`,
  `escalate_strategy_research_with_local_evidence`,
  `stop_for_human_annotation_or_source_approval`, or
  `stop_until_crop_roi_repair_evidence_exists`;
- M3BO result: commit `056a365` completed the authorized local/no-spend,
  no-training crop/ROI contract. It found no nonempty training-worthy retained
  subset, confirmed Brev and recognizer training remain unjustified, and
  identified ten held-out drift rows requiring reviewed coarse ROI inclusion
  evidence before a crop-config repair or training receipt can be trusted;
- M3BO selected next action:
  `continue_manual_coarse_roi_packet`;
- active M3BP prompt:
  [`docs/model/return-to-form-asl-citizen-manual-coarse-roi-packet-goal-loop-prompt.md`](return-to-form-asl-citizen-manual-coarse-roi-packet-goal-loop-prompt.md);
- M3BP required receipt:
  [`docs/validation/return-to-form-asl-citizen-manual-coarse-roi-packet-v1.json`](../validation/return-to-form-asl-citizen-manual-coarse-roi-packet-v1.json);
- M3BP objective: complete exactly one local/no-spend, no-training
  manifest-bound manual coarse ROI packet for the ten ASL Citizen high-signal
  drift rows identified in M3BO. The packet must record evidence paths,
  per-row ROI decisions, label-level retained-subset status, training gates,
  and exactly one next action without source import, pseudo-label generation,
  manifest/tensor mutation, Brev, training, export, or claim changes;
- exact M3BP next action choices:
  `continue_crop_config_repair_contract`,
  `continue_bounded_local_training_receipt`,
  `continue_bounded_brev_training_receipt`,
  `escalate_strategy_research_with_local_evidence`,
  `stop_for_human_roi_review`,
  `stop_for_human_annotation_or_source_approval`, or
  `stop_until_crop_roi_repair_evidence_exists`;
- M3BP result: commit `7d80ce8` completed the authorized local/no-spend,
  no-training manual coarse ROI packet. It found all ten target drift rows
  have viewable local evidence and manually clear coarse ROI inclusion, found
  zero rows requiring crop-config repair, but still found no training-worthy
  retained subset. `hello` is the only plausible ROI-visibility candidate, and
  held-out zero-recall / never-predicted gates plus crop-stat drift remain
  unresolved;
- M3BP selected next action:
  `escalate_strategy_research_with_local_evidence`;
- observer strategy escalation:
  [`artifacts/research/observer-364-post-roi-strategy-api-response.md`](../../artifacts/research/observer-364-post-roi-strategy-api-response.md);
- observer escalation result: Brev, recognizer training, source work, Detector
  0/schema repair, crop-config repair, product-only work, and STOP are not
  authorized for the next slice. The selected bounded next mission is one
  local/no-spend, no-training label/split/tensor drift diagnosis after ROI
  clearance;
- active M3BQ prompt:
  [`docs/model/return-to-form-label-split-tensor-drift-diagnosis-goal-loop-prompt.md`](return-to-form-label-split-tensor-drift-diagnosis-goal-loop-prompt.md);
- M3BQ required receipt:
  [`docs/validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json`](../validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json);
- M3BQ objective: complete exactly one local/no-spend, no-training diagnosis
  packet over the seven M3BP labels (`table`, `please`, `black`, `hello`,
  `uncle`, `white`, `sad`). The packet must classify label mapping,
  split/domain support, tensor/stat drift, and local evidence quality, decide
  whether at least two labels are training-worthy before any training receipt,
  and choose exactly one next action without source import, pseudo-label
  generation, manifest/tensor mutation, crop-config mutation, Brev, training,
  export, or claim changes;
- exact M3BQ next action choices:
  `prepare_label_mapping_defect_repair_packet`,
  `prepare_vocab_reselection_packet_from_existing_local_artifacts`,
  `prepare_model_data_design_ablation_packet`,
  `prepare_bounded_training_compute_receipt_for_human_approval`, or
  `stop_for_human_strategy_decision`;
- M3BQ result: commit `8531e99` completed the authorized local/no-spend,
  no-training label/split/tensor drift diagnosis. It cleared class-index
  mapping and tensor availability for the seven scoped labels, but found no
  retained training-worthy labels. The current seven-label set is blocked by
  split/stat drift, source-quality suspicion, insufficient held-out support, or
  prior zero-recall / never-predicted gates rather than by class-index mapping
  or tensor availability;
- M3BQ selected next action:
  `prepare_vocab_reselection_packet_from_existing_local_artifacts`;
- active M3BR prompt:
  [`docs/model/return-to-form-vocab-reselection-existing-local-artifacts-goal-loop-prompt.md`](return-to-form-vocab-reselection-existing-local-artifacts-goal-loop-prompt.md);
- M3BR required receipt:
  [`docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json`](../validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json);
- M3BR objective: complete exactly one local/no-spend, no-training vocabulary
  reselection packet from already-approved local artifacts. The packet must
  inventory local approved artifacts, explicitly exclude blocked/stale/
  unsupported/nonlocal sources, decide whether a better 2+ label candidate
  subset exists before training, record remaining gates, and choose exactly one
  next action without source import, source-register approval, pseudo-label
  generation, manifest/tensor mutation, crop-config mutation, Brev, training,
  export, or claim changes;
- exact M3BR next action choices:
  `continue_reselected_subset_manifest_contract`,
  `continue_bounded_local_training_receipt`,
  `continue_bounded_brev_training_receipt`,
  `escalate_strategy_research_with_local_evidence`,
  `stop_for_human_source_or_annotation_approval`, or
  `stop_until_supported_training_data_exists`;
- M3BR result: commit `480c1f7` completed the local/no-spend, no-training
  vocabulary reselection packet. It found no existing materialized local
  approved artifact that already supports a 2+ label training-worthy subset,
  and selected `stop_until_supported_training_data_exists`;
- M3BS activation: the user explicitly restarted the overnight ML/product
  completion push. The M3BR stop remains correct for existing materialized
  artifacts, but it does not rule out creating a new supported subset from
  approved raw PopSign files that already exist locally;
- M3BS candidate audit:
  [`docs/validation/return-to-form-supported-raw-source-candidates-v1.json`](../validation/return-to-form-supported-raw-source-candidates-v1.json);
- M3BS active prompt:
  [`docs/model/return-to-form-popsign-fresh5-materialization-local-smoke-goal-loop-prompt.md`](return-to-form-popsign-fresh5-materialization-local-smoke-goal-loop-prompt.md);
- M3BS required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json);
- M3BS objective: materialize the fresh `popsign_fresh_5_v1` candidate
  (`thank_you`, `pen`, `home`, `who`, `morning`) from approved local PopSign
  raw videos, validate source-bound manifests, decode hash-pinned raw-RGB
  tensors if manifest validation passes, run one capped local smoke if
  tensor/dry-run gates pass, and decide whether the next bounded step is
  region-grid/Detector 0 materialization, a Brev compute receipt, fresh10
  expansion, a local model/data ablation, source/annotation approval, or stop;
- exact M3BS next action choices:
  `continue_region_grid_or_detector0_tensor_materialization`,
  `continue_brev_training_receipt_for_fresh5`,
  `continue_fresh10_materialization`,
  `continue_local_model_data_design_ablation`,
  `stop_for_human_source_or_annotation_approval`, or
  `stop_until_supported_training_data_exists`;
- M3BS result: commit `6c49aae` materialized valid PopSign fresh5 full-frame
  manifests/tensors, ran a capped local smoke, and found weak held-out signal:
  test top-1 `0.272`, test macro F1 `0.20170903619228636`, false-pass rate
  `0.104`, and zero test recall for `morning` and `pen`. The receipt selected
  `continue_region_grid_or_detector0_tensor_materialization`;
- active M3BT prompt:
  [`docs/model/return-to-form-popsign-fresh5-region-grid-materialization-goal-loop-prompt.md`](return-to-form-popsign-fresh5-region-grid-materialization-goal-loop-prompt.md);
- M3BT required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json);
- M3BT objective: materialize, verify, or precisely block PopSign fresh5
  region-grid/fixed-crop tensors from the existing approved local raw videos
  before any more classifier training, and decide whether the next bounded step
  is a local region-grid smoke, Detector 0/crop contract, local model/data
  design ablation, human source/crop/annotation decision, or stop;
- exact M3BT next action choices:
  `continue_capped_local_fresh5_region_grid_smoke`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_local_model_data_design_ablation`,
  `stop_for_source_or_region_annotation_decision`, or
  `stop_until_supported_input_contract_exists`;
- M3BT result: commit `9081174` materialized valid PopSign fresh5 region-grid
  manifests/tensors from the existing approved local raw videos. The receipt
  records 375 tensors, zero missing files, tensor SHA-256 evidence for every
  manifest clip, dry-run/check-files proof for `rgb_regions_grid_v1: 375`,
  no local/remote training, no Brev spend, no browser activation, no
  promotion, and selected `continue_capped_local_fresh5_region_grid_smoke`;
- active M3BU prompt:
  [`docs/model/return-to-form-popsign-fresh5-region-grid-local-smoke-goal-loop-prompt.md`](return-to-form-popsign-fresh5-region-grid-local-smoke-goal-loop-prompt.md);
- M3BU required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json);
- M3BU objective: run exactly one bounded local/no-spend PopSign fresh5
  classifier smoke against the M3BT `rgb_regions_grid_v1` manifests/tensors,
  compare it with the weak M3BS full-frame baseline, decide whether a later
  Brev compute receipt, local ablation, Detector 0/crop contract, fresh10
  materialization, or stop is justified, and choose exactly one next action;
- exact M3BU next action choices:
  `continue_bounded_brev_training_receipt_for_fresh5_region_grid`,
  `continue_local_model_data_design_ablation`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_fresh10_region_grid_materialization`,
  `stop_for_human_training_budget_or_source_decision`, or
  `stop_until_supported_training_signal_exists`;
- M3BU result: commit `19dfdfe` completed one bounded local PopSign fresh5
  region-grid smoke. It proved `rgb_regions_grid_v1` consumption, improved the
  M3BS full-frame baseline, and removed test zero-recall labels, but remained
  weak enough that Brev, fresh10, export, promotion, and browser activation
  are not justified: test top-1 `0.288`, test macro F1
  `0.2593486590038314`, test false-pass rate `0.064`, and `pen` test recall
  `0.04`. The important limitation is that M3BU did not preserve the region
  axis: it derived the five regional crops into a `[T,192,288,3]` mosaic and
  resized that to `[T,3,96,96]` before the `motion_2d_temporal_cnn`. It is a
  useful smoke, but not a decisive test of the intended
  `B,T,R,C,H,W` region-aware recognizer. The receipt selected
  `continue_local_model_data_design_ablation`;
- active M3BV prompt:
  [`docs/model/return-to-form-popsign-fresh5-model-data-design-ablation-goal-loop-prompt.md`](return-to-form-popsign-fresh5-model-data-design-ablation-goal-loop-prompt.md);
- M3BV required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json);
- M3BV objective: run or precisely block exactly one local/no-spend
  model/input/data design ablation against the same approved PopSign fresh5
  `rgb_regions_grid_v1` manifests/tensors, with predeclared hypothesis,
  command, caps, seed, and thresholds, and decide whether the blocker is
  model/input design, data/vocabulary/split, crop/region target, compute
  budget, or inconclusive. Preferred diagnostic: a deterministic PopSign
  fresh5 tiny-overfit/input-contract probe that preserves region identity as
  `B,T,R,C,H,W` and asks whether the approved PopSign fresh5 tensors/labels can
  be memorized by the intended region-aware path before blaming the dataset or
  spending Brev compute;
- exact M3BV next action choices:
  `continue_bounded_brev_training_receipt_for_fresh5_region_grid`,
  `continue_data_vocabulary_separability_packet`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_fresh10_region_grid_materialization`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_strategy_decision`;
- M3BV result: commit `c7b0771` completed one bounded local/no-spend
  preserved-region PopSign fresh5 tiny-overfit/input-contract probe. It proved
  the intended `true_temporal_convnet_region_grid` path consumed
  `rgb_regions`, derived `rgb_regions_grid_v1`, preserved the input as
  `B,T,R,C,H,W`, avoided the M3BU mosaic path, and memorized one deterministic
  train clip per label with final tiny-subset accuracy `1.0` and no
  zero-recall selected labels. This rules out a total model/input-contract
  break, but it is not held-out success; Brev, fresh10, export, promotion, and
  browser activation remain unjustified. The receipt classified the blocker as
  `data_vocabulary_split_or_crop_generalization` and selected
  `continue_data_vocabulary_separability_packet`;
- active M3BW prompt:
  [`docs/model/return-to-form-popsign-fresh5-data-vocabulary-separability-goal-loop-prompt.md`](return-to-form-popsign-fresh5-data-vocabulary-separability-goal-loop-prompt.md);
- M3BW required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`](../validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json);
- M3BW objective: complete exactly one local/no-spend, no-training PopSign
  fresh5 data/vocabulary separability packet from existing receipts, manifests,
  tensors, prediction/report artifacts, and source metadata. The packet must
  explain why the preserved-region model/input path can memorize locally while
  M3BU held-out signal remains weak, classify whether the current blocker is
  label/vocabulary separability, split/source distribution, crop/region-target
  quality, compute budget, or unsupported training signal, and choose exactly
  one next action;
- exact M3BW next action choices:
  `continue_fresh5_vocab_split_remediation_packet`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_bounded_brev_training_receipt_for_fresh5_region_grid`,
  `continue_fresh10_region_grid_materialization`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_source_annotation_or_strategy_decision`;
- M3BW result: commit `a13dc9a` completed one local/no-spend, no-training
  PopSign fresh5 separability diagnosis from existing artifacts. It classified
  the blocker as `data_vocabulary_split_source_distribution`: M3BV proved
  train-fit on the preserved-region path, but M3BU held-out signal stayed weak,
  `pen` test recall stayed `0.04`, `thank_you` absorbed `0.568` of test
  predictions, train/validation/test signer overlap was zero, tensor inventory
  was complete, and tensor-motion summaries did not show a decisive empty
  hand-region failure. The receipt did not justify Brev, fresh10
  materialization, Detector 0/crop work, export, browser activation, model-card
  promotion, or final claim changes; it selected
  `continue_fresh5_vocab_split_remediation_packet`;
- active M3BX prompt:
  [`docs/model/return-to-form-popsign-fresh5-vocab-split-remediation-goal-loop-prompt.md`](return-to-form-popsign-fresh5-vocab-split-remediation-goal-loop-prompt.md);
- M3BX required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json);
- M3BX objective: complete exactly one local/no-spend, no-training PopSign
  fresh5 vocabulary/split/source-quality remediation design packet from
  existing artifacts. The packet must convert the M3BW diagnosis into a
  concrete bounded next route without training, manifest/tensor mutation,
  source import, Brev, export, browser activation, promotion, final-gate
  changes, or push;
- exact M3BX next action choices:
  `continue_fresh5_repaired_manifest_contract`,
  `continue_fresh10_region_grid_materialization`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_bounded_brev_training_receipt_for_fresh5_region_grid`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_source_annotation_or_strategy_decision`;
- M3BX result: commit `99e301a` completed one local/no-spend, no-training
  PopSign fresh5 vocabulary/split/source-quality remediation design packet from
  existing artifacts. It classified the blocker as
  `fresh5_manifest_split_source_quality_contract_needed`, kept Brev, fresh10
  widening, Detector 0/crop work, export, promotion, and browser activation
  unjustified, and selected
  `continue_fresh5_repaired_manifest_contract`;
- active M3BY prompt:
  [`docs/model/return-to-form-popsign-fresh5-repaired-manifest-contract-goal-loop-prompt.md`](return-to-form-popsign-fresh5-repaired-manifest-contract-goal-loop-prompt.md);
- M3BY required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json);
- M3BY objective: complete exactly one local/no-spend, no-training PopSign
  fresh5 repaired manifest/split/source-quality contract from existing
  artifacts. The packet must verify or precisely block the same-label contract
  for `thank_you`, `pen`, `home`, `who`, and `morning`, including source
  approval, split boundaries, cross-split leakage, dedupe, signer/source
  coverage, tensor availability, and `pen`/`thank_you` risk gates, without
  training, manifest/tensor mutation, source import, Brev, export, browser
  activation, promotion, final-gate changes, or push;
- exact M3BY next action choices:
  `continue_fresh5_repaired_manifest_materialization`,
  `continue_fresh10_region_grid_materialization`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_bounded_brev_training_receipt_for_fresh5_region_grid`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_source_annotation_or_strategy_decision`;
- M3BY result: commit `b1b5438` completed one local/no-spend, no-training
  PopSign fresh5 repaired manifest/split/source-quality contract verification
  from existing artifacts. It verified the same five labels, same approved
  source lane, preserved train/validation/test source splits, no source/clip/
  tensor cross-split leakage, 125 manifest-bound tensors per split with
  matching hashes, per-label clip and signer coverage, and explicit `pen` /
  `thank_you` stop conditions. It kept Brev, fresh10 widening, Detector 0/crop
  work, export, promotion, and browser activation unjustified, and selected
  `continue_fresh5_repaired_manifest_materialization`;
- active M3BZ prompt:
  [`docs/model/return-to-form-popsign-fresh5-repaired-manifest-materialization-goal-loop-prompt.md`](return-to-form-popsign-fresh5-repaired-manifest-materialization-goal-loop-prompt.md);
- M3BZ required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json);
- M3BZ objective: complete exactly one local/no-spend, no-training PopSign
  fresh5 repaired manifest materialization from the verified M3BY contract, or
  precisely block it. If materialization succeeds, it must write a versioned
  same-label manifest package at
  `data/manifests/return-to-form-popsign-fresh5-repaired-v1/` with
  train/validation/test manifests plus `manifest-contract.json`, referencing
  only existing verified tensor files and preserving source/split/signer/tensor
  provenance and `pen`/`thank_you` stop conditions;
- exact M3BZ next action choices:
  `continue_bounded_fresh5_learnability_isolation_probe`,
  `continue_fresh10_region_grid_materialization`,
  `continue_detector0_or_crop_contract_for_fresh5`,
  `continue_bounded_brev_training_receipt_for_fresh5_region_grid`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_source_annotation_or_strategy_decision`;
- M3BZ steering note: if materialization succeeds, the next local/no-spend
  training-style slice must be a bounded learnability-isolation probe, not a
  generic classifier smoke. It must distinguish data/split/label issues from
  crop/input preprocessing and model/training-loop issues by checking train-all
  overfit, relaxed/random or signer-overlap split behavior, signer-disjoint
  behavior, `pen` / `thank_you` confusion, and preserved
  `true_temporal_convnet_region_grid` region-axis input before any Brev or
  promotion planning;
- M3BZ result: commit `002cd90` completed one local/no-spend, no-training
  PopSign fresh5 repaired manifest materialization. It created tracked
  train/validation/test manifests plus `manifest-contract.json` under
  `data/manifests/return-to-form-popsign-fresh5-repaired-v1/`, verified same
  labels/source, preserved PopSign split boundaries, no source/clip/tensor/
  signer cross-split leakage, existing tensor references and hashes for all
  375 clips, and carried `pen` / `thank_you` stop conditions. It kept Brev,
  fresh10 widening, Detector 0/crop work, export, promotion, and browser
  activation unjustified, and selected
  `continue_bounded_fresh5_learnability_isolation_probe`;
- active M3CA prompt:
  [`docs/model/return-to-form-popsign-fresh5-learnability-isolation-probe-goal-loop-prompt.md`](return-to-form-popsign-fresh5-learnability-isolation-probe-goal-loop-prompt.md);
- M3CA required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json);
- M3CA objective: complete exactly one bounded local/no-spend PopSign fresh5
  learnability-isolation probe from the repaired manifest package. The probe
  must distinguish dataset/split/label quality from crop/input preprocessing
  and model/training-loop learnability by recording train-all overfit,
  relaxed/random or signer-overlap split behavior, signer-disjoint validation/
  test behavior, `pen` / `thank_you` confusion, preserved
  `true_temporal_convnet_region_grid` region-axis input, and M3BU/M3BV
  comparison before any compute planning, Brev, export, promotion, browser
  activation, or final claim change;
- exact M3CA next action choices:
  `continue_bounded_compute_receipt_for_fresh5_repaired_region_grid`,
  `continue_fresh5_data_split_label_quality_remediation`,
  `continue_model_input_or_training_loop_remediation`,
  `continue_crop_or_region_target_contract_for_fresh5`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_source_annotation_or_strategy_decision`;
- M3CA result: commit `c58ff44` completed one bounded local/no-spend PopSign
  fresh5 learnability-isolation probe. It preserved
  `true_temporal_convnet_region_grid` region-axis input and compared
  train-all, relaxed signer-overlap, and signer-disjoint behavior. The probe
  failed train sanity under cap: train-all accuracy `0.464`, relaxed accuracy
  `0.32`, signer-disjoint validation/test accuracy `0.256` / `0.328`, `pen`
  test recall `0.04`, and `thank_you` prediction fraction `0.048`. It kept
  Brev, compute receipt planning, export, promotion, and browser activation
  unjustified, classified the blocker as `model_input_or_training_loop`, and
  selected `continue_model_input_or_training_loop_remediation`;
- active M3CB prompt:
  [`docs/model/return-to-form-popsign-fresh5-model-input-training-loop-remediation-goal-loop-prompt.md`](return-to-form-popsign-fresh5-model-input-training-loop-remediation-goal-loop-prompt.md);
- M3CB required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json);
- M3CB objective: complete exactly one bounded local/no-spend, no-training
  model/input/training-loop remediation audit from existing M3CA, M3BV, and
  M3BU evidence. It must identify or rule out concrete code/input/training-loop
  defects with file/symbol evidence before any further fitting run, Brev,
  architecture/input-representation change, export, promotion, browser
  activation, or final claim change;
- exact M3CB next action choices:
  `continue_concrete_model_input_training_loop_fix`,
  `continue_no_training_architecture_or_optimization_research`,
  `continue_crop_or_region_target_contract_for_fresh5`,
  `continue_fresh5_data_split_label_quality_remediation`,
  `stop_until_supported_training_signal_exists`, or
  `stop_for_human_source_annotation_or_strategy_decision`;
- M3CB result: commit `bf8fef5` completed one local/no-spend, no-training
  PopSign fresh5 model/input/training-loop remediation audit from existing
  M3CA/M3BV/M3BU evidence. It found no concrete local label/index, tensor
  shape/order, normalization, loss, device/dtype, or optimizer-loop defect.
  M3BV can memorize one deterministic clip per label, while M3CA expanded to
  the balanced 125-clip repaired train split and still reached only `0.464`
  train-all eval accuracy under cap. It classified the blocker as
  `architecture_or_optimization_research`, kept another fitting run, Brev,
  export, promotion, and browser activation unjustified, and selected
  `continue_no_training_architecture_or_optimization_research`;
- observer strategy escalation:
  [`artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-response.md`](../../artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-response.md);
- observer escalation result: training/fitting, Brev compute, export, browser
  activation, source expansion, pseudo-labeling, crop/region-target
  implementation, data/split/label mutation, product-only work, and STOP are
  not authorized for the next slice. The selected bounded next mission is one
  local/no-spend, no-training PopSign fresh5 architecture/optimization research
  packet;
- active M3CC prompt:
  [`docs/model/return-to-form-popsign-fresh5-architecture-optimization-research-goal-loop-prompt.md`](return-to-form-popsign-fresh5-architecture-optimization-research-goal-loop-prompt.md);
- M3CC required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json);
- M3CC objective: complete exactly one local/no-spend, no-training PopSign
  fresh5 architecture/optimization research packet from existing M3CA/M3CB/
  M3BV/M3BU evidence. The packet must separate source-supported observations
  from inference, rank plausible from-scratch browser-compatible
  architecture/optimization/input-family hypotheses, reject unsupported
  shortcuts, preserve fail-closed browser claims, and choose exactly one next
  action without training, Brev, source expansion, pseudo-labeling, manifest/
  tensor mutation, export, promotion, final-gate changes, or push;
- exact M3CC next action choices:
  `propose_local_crop_region_target_contract_audit_no_training`,
  `propose_local_data_split_label_distribution_audit_no_mutation`,
  `propose_architecture_optimization_design_review_no_training`,
  `request_separate_training_receipt_after_specific_reviewed_change`, or
  `stop_no_nonwasteful_next_action`;
- M3CC result: commit `212734a` completed one local/no-spend, no-training
  PopSign fresh5 architecture/optimization research packet from existing
  M3CA/M3CB/M3BV/M3BU evidence and the observer-391 API memo. It ranked seven
  plausible hypotheses, including optimization/regularization mismatch,
  capacity or inductive-bias mismatch, temporal modeling weakness,
  region/crop target insufficiency, signer-disjoint data scarcity,
  class-specific `pen` / `thank_you` failure modes, and browser deployment
  constraints. It rejected eight unsupported action classes, kept training,
  Brev, source/data mutation, export, promotion, and browser activation
  unauthorized, and selected
  `propose_architecture_optimization_design_review_no_training`;
- active M3CD prompt:
  [`docs/model/return-to-form-popsign-fresh5-architecture-optimization-design-review-goal-loop-prompt.md`](return-to-form-popsign-fresh5-architecture-optimization-design-review-goal-loop-prompt.md);
- M3CD required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json);
- M3CD objective: complete exactly one local/no-spend, no-training PopSign
  fresh5 architecture/optimization design review from the M3CC research packet.
  The review must name one concrete from-scratch proposal and validation
  contract, or record the precise blocker preventing that selection. It must
  compare at least three alternatives from M3CC, record browser-size/runtime
  constraints, input-contract assumptions, future train-sanity/held-out and
  `pen` / `thank_you` criteria, early stop conditions, and choose exactly one
  next action without training, Brev, source expansion, pseudo-labeling,
  manifest/tensor mutation, export, promotion, final-gate changes, or push;
- exact M3CD next action choices:
  `continue_no_training_architecture_scaffold_contract`,
  `continue_crop_region_target_contract_audit_no_training`,
  `continue_data_split_label_distribution_audit_no_mutation`,
  `prepare_separate_training_compute_receipt_after_reviewed_change`, or
  `stop_for_human_architecture_budget_or_scope_decision`;
- M3CD result: commit `eca7cb9` completed one local/no-spend, no-training
  PopSign fresh5 architecture/optimization design review from the M3CC research
  packet. It selected
  `scratch_region_temporal_late_fusion_tcn_contract_v1`, a from-scratch
  browser-compatible contract that preserves `rgb_regions` as `B,T,R,C,H,W`,
  applies temporal modeling per region before fusion, and requires compile/
  no-grad/parameter-count proof before any fitting. It compared five M3CC
  alternatives, kept training, Brev, source/data mutation, export, promotion,
  and browser activation unauthorized, and selected
  `continue_no_training_architecture_scaffold_contract`;
- active M3CE prompt:
  [`docs/model/return-to-form-popsign-fresh5-architecture-scaffold-contract-goal-loop-prompt.md`](return-to-form-popsign-fresh5-architecture-scaffold-contract-goal-loop-prompt.md);
- M3CE required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json);
- M3CE objective: complete exactly one local/no-spend, no-training architecture
  scaffold contract for `scratch_region_temporal_late_fusion_tcn_contract_v1`,
  or precisely block it. The scaffold must accept `rgb_regions` /
  `rgb_regions_grid_v1` as `B,T,R,C,H,W`, avoid fallback to `rgb_frames`,
  return `B,5` logits, report parameter count against the M3CB `1290470`
  baseline and M3CD `2000000` target / `2500000` hard ceiling, use random
  initialization only, and construct no optimizer, run no backward pass, run no
  fitting loop, and write no checkpoint/model/tensor/manifest/export/browser/
  model-card artifact. It must also record train/eval-sensitive layers
  (BatchNorm, Dropout, running statistics, stochastic behavior) and explicitly
  address the M3CA train-mode/eval-mode gap (`0.664` peak train-mode accuracy,
  `0.56` final train-mode accuracy, `0.464` eval train-all accuracy). The
  receipt must record dataset-to-training compatibility: PopSign fresh5 tensors
  are the scoped input, SemLex / ASL-LEX is only a candidate phonology/
  vocabulary-support route until source-register and local overlap/phonology
  artifacts exist, and ASL Citizen/public sources cannot be substituted without
  their own source and manifest contract;
- exact M3CE next action choices:
  `continue_no_training_architecture_scaffold_fix`,
  `continue_no_training_parameter_or_shape_contract_review`,
  `prepare_separate_training_compute_receipt_after_scaffold_passes`,
  `continue_data_split_label_distribution_audit_no_mutation`,
  `continue_train_eval_normalization_contract_no_training`,
  `continue_dataset_training_compatibility_audit_no_mutation`, or
  `stop_for_human_architecture_budget_or_scope_decision`;
- M3CE result: commit `df6e719` completed one local/no-spend, no-training
  PopSign fresh5 architecture scaffold contract for
  `scratch_region_temporal_late_fusion_tcn_contract_v1`. It added the
  scaffold to `scripts/train_rawframe_model.py`, verified compile/no-grad
  input `[2,16,5,3,96,96]` to logits `[2,5]`, counted `781918` trainable
  parameters, avoided BatchNorm, Dropout, and running statistics by using
  GroupNorm and LayerNorm, recorded PopSign/SemLex/ASL-LEX/ASL Citizen source
  compatibility, kept training, Brev, source/data mutation, export, promotion,
  and browser activation unauthorized, and selected
  `prepare_separate_training_compute_receipt_after_scaffold_passes`;
- active M3CF prompt:
  [`docs/model/return-to-form-popsign-fresh5-training-compute-receipt-goal-loop-prompt.md`](return-to-form-popsign-fresh5-training-compute-receipt-goal-loop-prompt.md);
- M3CF required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json`](../validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json);
- M3CF objective: complete exactly one local/no-spend, no-training compute
  receipt for a future PopSign fresh5 fitting attempt using the M3CE scaffold,
  or precisely block that receipt. The receipt must record exact planned
  command(s), local vs Brev route, current Brev state, instance type/GPU, price
  or price blocker, max runtime/spend, kill condition, expected metric signal,
  artifacts/output/copyback, cleanup/default-off verification,
  duplicate-worker avoidance, current human approval status, command
  compatibility, and the carried-forward train/eval and `pen` / `thank_you`
  gates. It must verify whether the planned training mode accepts
  `scratch_region_temporal_late_fusion_tcn_contract_v1`, because the scaffold
  is in `ALLOWED_MODEL_ARCHITECTURES` but not currently in
  `FINAL_MODEL_ARCHITECTURES`;
- exact M3CF next action choices:
  `continue_training_invocation_contract_fix_no_training`,
  `continue_local_no_spend_train_sanity_receipt_preflight`,
  `prepare_bounded_local_train_sanity_run_after_current_approval`,
  `prepare_bounded_brev_training_run_after_current_approval_and_default_off_plan`,
  `continue_data_split_label_distribution_audit_no_mutation`, or
  `stop_for_human_training_budget_or_scope_decision`;
- M3CF result: commit `c248dc1` completed one local/no-spend, no-training
  compute receipt for the future PopSign fresh5 fitting path. It proved the
  intended dry-run/check-files command is blocked before fitting because
  `--region-grid-tcn-training-smoke` requires
  `true_temporal_convnet_region_grid`, while the M3CE scaffold is
  `scratch_region_temporal_late_fusion_tcn_contract_v1`. It also recorded that
  the current region-grid TCN smoke mode is hard-coded to the older ASL Citizen
  high-signal region-grid manifests and `output/m3aw-region-grid-tcn-local-smoke`.
  It kept training, Brev exec/sync/lifecycle, source/data mutation, export,
  promotion, and browser activation unauthorized, and selected
  `continue_training_invocation_contract_fix_no_training`;
- active M3CG prompt:
  [`docs/model/return-to-form-popsign-fresh5-training-invocation-contract-fix-goal-loop-prompt.md`](return-to-form-popsign-fresh5-training-invocation-contract-fix-goal-loop-prompt.md);
- M3CG required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json);
- M3CG objective: complete exactly one local/no-spend, no-training
  invocation-contract fix for the PopSign fresh5 repaired-manifest path using
  the M3CE scaffold, or precisely block it. The fix must make the intended
  PopSign fresh5 `--dry-run --check-files` compatibility path reviewable for
  `scratch_region_temporal_late_fusion_tcn_contract_v1` without launching
  training, must not blindly widen `FINAL_MODEL_ARCHITECTURES` or global
  final/lesson/reduced/controlled training guards, and must keep any later
  fitting run blocked behind a refreshed compute receipt and current approval;
- exact M3CG next action choices:
  `continue_training_invocation_contract_fix_no_training`,
  `continue_compute_receipt_refresh_after_invocation_contract_fix`,
  `continue_local_no_spend_train_sanity_receipt_preflight`,
  `continue_data_split_label_distribution_audit_no_mutation`, or
  `stop_for_human_training_budget_or_scope_decision`;
- M3CG result: commit `210942f` completed one local/no-spend, no-training
  PopSign fresh5 invocation-contract fix. It added a dedicated
  `--popsign-fresh5-training-smoke` mode for the repaired PopSign fresh5
  manifests and `scratch_region_temporal_late_fusion_tcn_contract_v1`, proved
  the no-side-effect dry-run/check-files command exits `0`, preserves the
  region axis, loads 125 clips across five labels in each split, and creates
  no output directory, checkpoint, tensor, or manifest artifact. It kept
  `FINAL_MODEL_ARCHITECTURES`, final/lesson/reduced/controlled training
  guards, the old `--region-grid-tcn-training-smoke` contract, Brev, export,
  promotion, and browser activation strict, and selected
  `continue_compute_receipt_refresh_after_invocation_contract_fix`;
- M3CH prompt:
  [`docs/model/return-to-form-popsign-fresh5-training-compute-receipt-refresh-goal-loop-prompt.md`](return-to-form-popsign-fresh5-training-compute-receipt-refresh-goal-loop-prompt.md);
- M3CH required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json`](../validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json);
- M3CH objective: complete exactly one local/no-spend, no-training compute
  receipt refresh for a future PopSign fresh5 fitting attempt using the M3CE
  scaffold and M3CG invocation contract, or precisely block that refresh. The
  receipt must record the compatible no-side-effect dry-run command, planned
  non-dry-run fitting command intentionally not run, local vs Brev route,
  current Brev state, instance type/GPU, price or price blocker, max runtime/
  spend, kill condition, expected metric signal, artifacts/copyback/default-off
  verification, duplicate-worker avoidance, current approval status, and the
  carried-forward `pen`, `thank_you`, train-all, signer-disjoint, train-mode,
  and eval-mode metric gates. It must not run fitting, construct an optimizer
  for fitting, call backward, write checkpoints, run Brev exec/sync/lifecycle,
  mutate source/manifest/tensor artifacts, export, promote, change final gates,
  or push;
- exact M3CH next action choices:
  `continue_compute_receipt_refresh_after_invocation_contract_fix`,
  `continue_local_no_spend_train_sanity_receipt_preflight`,
  `continue_evaluation_invocation_contract_fix_no_training`,
  `prepare_bounded_local_train_sanity_run_after_current_approval`,
  `prepare_bounded_brev_training_run_after_current_approval_and_default_off_plan`,
  `continue_data_split_label_distribution_audit_no_mutation`, or
  `stop_for_human_training_budget_or_scope_decision`;
- M3CH result: commit `8e8fd90` completed one local/no-spend, no-training
  PopSign fresh5 compute receipt refresh. It proved the training dry-run now
  accepts `scratch_region_temporal_late_fusion_tcn_contract_v1` with
  `--popsign-fresh5-training-smoke`, loads the repaired PopSign fresh5
  manifests, preserves `B,T,R,C,H,W`, and creates no output directory or
  checkpoint. It also proved the evaluation path is not yet compatible:
  `scripts/evaluate_rawframe_model.py` rejects
  `--popsign-fresh5-training-smoke` at argparse and has no PopSign fresh5
  evidence mode, repaired-manifest validation branch, challenge-manifest
  omission, decode-provenance exemption, or region-axis preservation for that
  mode. It selected
  `continue_evaluation_invocation_contract_fix_no_training`;
- active M3CI prompt:
  [`docs/model/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-goal-loop-prompt.md`](return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-goal-loop-prompt.md);
- M3CI required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json);
- M3CI objective: complete exactly one local/no-spend, no-training evaluation
  invocation-contract fix for the PopSign fresh5 repaired-manifest path, or
  precisely block it. The fix should make `scripts/evaluate_rawframe_model.py`
  accept `--popsign-fresh5-training-smoke`, emit
  `popsign_fresh5_training_smoke`, validate the repaired PopSign fresh5
  manifests with the existing PopSign branch, skip inappropriate challenge/
  final/decode-provenance gates for this bounded not-final smoke, preserve
  `B,T,R,C,H,W` through validation/test, and prove the intended evaluation
  command now reaches only the expected missing-checkpoint/provenance blocker.
  It must not run fitting, construct an optimizer for fitting, call backward,
  write checkpoints, run Brev exec/sync/lifecycle, mutate source/manifest/
  tensor artifacts, export, promote, change final gates, or push;
- exact M3CI next action choices:
  `continue_evaluation_invocation_contract_fix_no_training`,
  `continue_compute_receipt_refresh_after_evaluation_contract_fix`,
  `continue_local_no_spend_train_sanity_receipt_preflight`,
  `prepare_bounded_local_train_sanity_run_after_current_approval`,
  `prepare_bounded_brev_training_run_after_current_approval_and_default_off_plan`,
  `continue_data_split_label_distribution_audit_no_mutation`, or
  `stop_for_human_training_budget_or_scope_decision`;
- M3CI result: commit `3307465` completed one local/no-spend, no-training
  PopSign fresh5 evaluation invocation-contract fix. It added
  `--popsign-fresh5-training-smoke` to `scripts/evaluate_rawframe_model.py`,
  emits `popsign_fresh5_training_smoke`, validates the repaired PopSign fresh5
  manifests with the existing PopSign branch, skips inappropriate challenge/
  final/decode-provenance gates for this bounded not-final smoke, preserves
  `B,T,R,C,H,W` during validation/test, and proved the intended evaluation
  command reaches the expected missing-checkpoint blocker instead of argparse
  or manifest rejection;
- supervisor local train/eval sanity result:
  [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json);
- local sanity summary: PopSign fresh5 repaired-manifest plumbing works end to
  end, but the strict smoke cap is not enough to learn. Current bounded artifact
  reports test top-1 `0.2`, macro F1 `0.06666666666666668`, and
  `passes_targets: false`; broader attempts were rejected by output-dir, epoch,
  batch-size, and max-batch guardrails;
- active M3CJ prompt:
  [`docs/model/return-to-form-popsign-fresh5-learnability-run-contract-goal-loop-prompt.md`](return-to-form-popsign-fresh5-learnability-run-contract-goal-loop-prompt.md);
- M3CJ required next receipt:
  `docs/validation/return-to-form-popsign-fresh5-learnability-run-contract-v1.json`;
- M3CJ objective: add or precisely block one bounded PopSign fresh5
  learnability-run contract. Do not switch datasets again for this slice. The
  goal is to create a separate non-final mode large enough to test learning on
  the repaired PopSign fresh5 path while preserving random initialization,
  no-pretrained, source, manifest, tensor, final/lesson/browser, and region-axis
  guards. Run locally/no-spend before Brev; run Brev only after command, max
  runtime, max spend, kill condition, copyback, duplicate-worker check, and
  default-off cleanup are recorded;
- exact M3CJ next action choices:
  `run_bounded_local_popsign_fresh5_learnability_after_contract`,
  `prepare_bounded_brev_popsign_fresh5_learnability_after_local_signal`,
  `continue_learnability_contract_fix_no_training`,
  `continue_data_or_split_diagnosis_after_learnability_failure`, or
  `stop_for_human_budget_scope_or_codex_usage_limit`;
- M3CJ result: supervisor recovery expanded the PopSign fresh5 local smoke caps
  to five epochs, 32 train batches, and 32 validation batches, then ran bounded
  local no-Brev train/eval sanity. The repaired PopSign fresh5 path trains,
  checkpoints, and evaluates end to end, but the scratch region-temporal
  late-fusion TCN remains near chance: best observed train accuracy `0.264`,
  validation/test top-1 `0.2`, macro F1 `0.06666666666666668`, and prediction
  collapse to one class. It selected
  `continue_architecture_or_input_contract_microprobe_no_brev`;
- active M3CK prompt:
  [`docs/model/return-to-form-popsign-fresh5-architecture-input-microprobe-goal-loop-prompt.md`](return-to-form-popsign-fresh5-architecture-input-microprobe-goal-loop-prompt.md);
- M3CK required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json);
- M3CK objective: run one local/no-spend, no-Brev architecture/input microprobe
  that directly answers whether the M3CE architecture/input can train-fit a
  balanced tiny PopSign fresh5 subset, with gradient/logit/parameter-change,
  label distribution, and prediction-distribution evidence. Do not spend Brev
  until tiny train-fit or a better architecture/input route is demonstrated;
- exact M3CK next action choices:
  `continue_architecture_or_input_contract_microprobe_no_brev`,
  `fix_m3ce_architecture_or_input_adapter_no_brev`,
  `prepare_bounded_local_or_brev_train_all_after_train_fit_proof`,
  `fallback_to_prior_train_fitting_region_grid_tcn_family`,
  `continue_data_split_label_distribution_audit_no_mutation`, or
  `stop_for_human_training_budget_or_scope_decision`;
- M3CK result: commit `4a4a9f8` completed one bounded local/no-spend, no-Brev
  architecture/input microprobe for the M3CE scratch region-temporal late-fusion
  TCN. It preserved `B,T,R,C,H,W`, selected one deterministic balanced PopSign
  fresh5 clip per label, and proved tiny train-fit: final accuracy `1.0`, `5/5`
  correct, zero zero-recall labels, balanced prediction distribution, gradient
  L2 `5.675334829822763`, parameter delta L2 `2.462002909471669`, and model
  parameters changed. It kept Brev, source/register mutation, manifest/tensor
  mutation, pretrained dependency, export, browser activation, model-card
  promotion, final-gate changes, unsupported claims, and push unauthorized, and
  selected `continue_data_split_label_distribution_audit_no_mutation`;
- active M3CL prompt:
  [`docs/model/return-to-form-popsign-fresh5-data-split-label-distribution-audit-goal-loop-prompt.md`](return-to-form-popsign-fresh5-data-split-label-distribution-audit-goal-loop-prompt.md);
- M3CL required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json`](../validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json);
- M3CL objective: complete exactly one local/no-spend, no-training,
  no-mutation PopSign fresh5 data/split/label distribution audit from existing
  repaired-manifest evidence. The audit must explain whether the remaining
  train-all/generalization failure is best attributed to split/source/signer
  distribution, label distribution, per-label data quality, or a stop condition
  before more training, while preserving fail-closed browser claims and avoiding
  Brev, source/register mutation, manifest/tensor mutation, export, promotion,
  final-gate changes, or push;
- exact M3CL next action choices:
  `continue_data_split_label_distribution_audit_no_mutation`,
  `continue_split_source_quality_contract_no_mutation`,
  `continue_label_quality_review_packet_no_mutation`,
  `prepare_bounded_local_train_all_after_data_audit`,
  `prepare_training_compute_receipt_after_data_audit`, or
  `stop_for_human_source_label_scope_or_budget_decision`;
- M3CL result: commit `669b559` completed one bounded local/no-spend,
  no-training, no-mutation PopSign fresh5 data/split/label distribution audit.
  It found balanced repaired manifests (`25` clips per label in train,
  validation, and test), tensor completeness (`125/125` hash matches in each
  split), zero cross-split clip/source-record/signer/tensor-path/tensor-hash
  overlap, and no label-count imbalance, tensor coverage failure, cross-split
  leakage, or M3CE input-connectivity blocker. It classified the remaining
  train-all/generalization blocker as split/source/signer quality plus
  per-label source-quality behavior, kept local train-all and Brev compute
  unjustified, and selected `continue_split_source_quality_contract_no_mutation`;
- active M3CM prompt:
  [`docs/model/return-to-form-popsign-fresh5-split-source-quality-contract-goal-loop-prompt.md`](return-to-form-popsign-fresh5-split-source-quality-contract-goal-loop-prompt.md);
- M3CM required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json`](../validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json);
- M3CM objective: complete exactly one local/no-spend, no-training, no-mutation
  split/source/signer quality contract for the repaired PopSign fresh5 route.
  The contract must turn M3CL evidence into concrete train/validation/test
  split assumptions, source/signer quality gates, per-label source-risk gates,
  collapsed-class stop conditions, and next-action criteria before any longer
  local training or Brev compute, while preserving fail-closed browser claims
  and avoiding source/register mutation, manifest/tensor mutation, export,
  promotion, final-gate changes, or push;
- exact M3CM next action choices:
  `continue_split_source_quality_contract_no_mutation`,
  `continue_label_quality_review_packet_no_mutation`,
  `prepare_bounded_local_train_all_after_split_source_contract`,
  `prepare_training_compute_receipt_after_split_source_contract`, or
  `stop_for_human_source_label_scope_or_budget_decision`;
- M3CM result: commit `5a53e35` completed one bounded local/no-spend,
  no-training, no-mutation PopSign fresh5 split/source/signer quality contract.
  It passed the approved single-source PopSign lane, split-boundary,
  balance/support, cross-split disjointness, signer support/concentration, and
  tensor-contract gates, but did not claim external ASL educator review. It kept
  local train-all and Brev compute unjustified, flagged `pen` as highest
  priority and `thank_you` as high priority for source/label review, and
  selected `continue_label_quality_review_packet_no_mutation`;
- active M3CN prompt:
  [`docs/model/return-to-form-popsign-fresh5-label-source-quality-review-packet-goal-loop-prompt.md`](return-to-form-popsign-fresh5-label-source-quality-review-packet-goal-loop-prompt.md);
- M3CN required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`](../validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json);
- M3CN objective: complete exactly one local/no-spend, no-training, no-mutation
  label/source-quality review packet from existing PopSign fresh5 evidence. The
  packet must review all five labels, prioritize the `pen` and `thank_you` risk
  chain, state whether source-label ambiguity can be cleared without external
  ASL educator review, and decide whether the next prompt should be bounded
  local train-all, another no-training tensor/input-quality packet, or a human
  source/label/annotation/scope/budget decision;
- exact M3CN next action choices:
  `continue_label_quality_review_packet_no_mutation`,
  `prepare_bounded_local_train_all_after_label_quality_review`,
  `continue_no_training_tensor_or_input_quality_packet_after_label_review`, or
  `stop_for_human_source_label_annotation_scope_or_budget_decision`;
- M3CN result: commit `2a1f5e4` completed one bounded local/no-spend,
  no-training, no-mutation PopSign fresh5 label/source-quality review packet.
  It cleared mechanical source-label ambiguity for the repaired manifests,
  preserved expected source sign slugs across train/validation/test, confirmed
  `thank_you` maps consistently to source slug `thankyou`, and carried
  clip-level source label review/model-training allowance for every reviewed
  clip. It did not claim external ASL educator correctness or regional-variant
  review. It kept local train-all and Brev compute unjustified, classified the
  `pen` collapse as more consistent with training-distribution behavior or
  unresolved tensor/input quality, and selected
  `continue_no_training_tensor_or_input_quality_packet_after_label_review`;
- active M3CO prompt:
  [`docs/model/return-to-form-popsign-fresh5-tensor-input-quality-packet-goal-loop-prompt.md`](return-to-form-popsign-fresh5-tensor-input-quality-packet-goal-loop-prompt.md);
- M3CO required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`](../validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json);
- M3CO objective: complete exactly one local/no-spend, no-training, no-mutation
  tensor/input-quality packet from existing PopSign fresh5 tensors, manifests,
  and receipts. The packet must review all five labels, prioritize `pen` and
  `thank_you`, inspect tensor/input artifact paths, shapes, hashes, finite-value
  checks, near-zero or low-signal rates, temporal/region variance, motion/energy
  summaries, and loader-contract risks, then decide whether the next prompt
  should be bounded local train-all, another no-training training-distribution
  or sampler packet, or a human crop/tensor/source/scope/budget decision;
- exact M3CO next action choices:
  `continue_no_training_tensor_or_input_quality_packet_after_label_review`,
  `prepare_bounded_local_train_all_after_tensor_input_quality_packet`,
  `continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`,
  or `stop_for_human_crop_tensor_source_scope_or_budget_decision`;
- M3CO result: commit `070ba3d` completed one bounded local/no-spend,
  no-training, no-mutation PopSign fresh5 tensor/input-quality packet. It
  scanned all `375` repaired tensors, found matching manifest `.pt` hashes,
  stable `16x5x96x96x3` `torch.uint8` tensors, stable `T,R,H,W,C` region order,
  zero finite-value failures, zero near-zero frame clips, zero near-zero region
  clips, and no low-signal `pen` / `thank_you` outlier. It kept local train-all
  and Brev compute unjustified and selected
  `continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`;
- active M3CP prompt:
  [`docs/model/return-to-form-popsign-fresh5-training-distribution-sampler-packet-goal-loop-prompt.md`](return-to-form-popsign-fresh5-training-distribution-sampler-packet-goal-loop-prompt.md);
- M3CP required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json`](../validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json);
- M3CP objective: complete exactly one local/no-spend, no-training, no-mutation
  training-distribution/sampler packet from existing PopSign fresh5 manifests,
  receipts, provenance, and code paths. The packet must review train/validation/
  test label counts, class-index mapping, train batch accounting, batch cap
  behavior, epoch count, sample exposure per label, sampler/shuffle behavior,
  validation/test target mapping, and whether `pen` collapse is plausibly
  explained by exposure, sampler, batch, epoch, class-order, or evaluation
  distribution behavior before any fitting retry;
- exact M3CP next action choices:
  `continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`,
  `prepare_bounded_local_train_all_after_sampler_packet`,
  `continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`,
  or `stop_for_human_training_scope_budget_or_code_path_decision`;
- M3CP result: commit `c1a2437` completed one bounded local/no-spend,
  no-training, no-mutation PopSign fresh5 training distribution/sampler packet.
  It found balanced train/validation/test splits, full train/validation
  batch-cap coverage, consistent train/eval class mapping, `pen` class index
  `2` with train manifest range `[25, 49]`, no `pen` overexposure or
  underexposure, and no sampler/distribution blocker for the single-class
  collapse. It kept local train-all and Brev compute unjustified, carried the
  M3CJ/current-output reporting/provenance caveat, and selected
  `continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`;
- active M3CQ prompt:
  [`docs/model/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-goal-loop-prompt.md`](return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-goal-loop-prompt.md);
- M3CQ required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json`](../validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json);
- M3CQ objective: complete exactly one local/no-spend, no-training, no-mutation
  optimizer/loss/regularization packet from existing PopSign fresh5 receipts,
  current ignored output reports, training provenance, and train/eval code
  paths. The packet must review optimizer settings, learning rate, loss/target
  semantics, weight decay, label smoothing, gradient clipping, scheduler or
  regularization behavior, checkpoint selection, thresholding/reporting, and
  the M3CP provenance caveat before any fitting retry;
- exact M3CQ next action choices:
  `continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`,
  `prepare_bounded_local_train_all_after_optimizer_loss_packet`,
  `continue_no_training_checkpoint_selection_or_metric_reconciliation_packet`,
  or `stop_for_human_training_scope_budget_or_code_path_decision`;
- M3CQ result: commit `8d5e31f` completed one bounded local/no-spend,
  no-training, no-mutation PopSign fresh5 optimizer/loss/regularization packet.
  It found no visible optimizer/loss/target wiring defect, confirmed current
  train-all used AdamW, CrossEntropyLoss over `torch.long` class-index targets,
  no scheduler, no class weights, no gradient clipping, no train augmentation,
  no active dropout/BatchNorm state, weight decay `0.0`, and label smoothing
  `0.0`. It reconciled the M3CP provenance caveat by showing current ignored
  artifacts hash-match M3CJ's artifact list and use default `final` checkpoint
  selection with single-class `morning`, superseding the stale M3CJ summary row
  that said `best_validation` / `pen`. It kept Brev unjustified and selected
  `prepare_bounded_local_train_all_after_optimizer_loss_packet`;
- active M3CR prompt:
  [`docs/model/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-goal-loop-prompt.md`](return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-goal-loop-prompt.md);
- M3CR required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json);
- M3CR objective: run or precisely block exactly one bounded local/no-spend
  train-all attempt for the repaired PopSign fresh5 route. The run must use one
  predeclared optimizer-schedule hypothesis, explicit checkpoint selection, an
  ignored local output directory, and a tracked receipt with train/validation/
  test metrics, confusion/prediction distribution, per-label recall, threshold
  metrics, artifact hashes, and M3CJ comparison. It must not run Brev, sweep,
  switch datasets, mutate source/manifests/tensors, export, promote, change
  final gates, or push;
- exact M3CR next action choices:
  `continue_bounded_local_train_all_after_optimizer_loss_packet`,
  `continue_no_training_local_train_all_result_diagnosis`,
  `prepare_compute_receipt_or_export_readiness_review_after_local_signal`,
  or `stop_for_human_training_scope_budget_or_code_path_decision`;
- M3CR result: commit `5983c54` completed the post-contract bounded
  local/no-spend PopSign fresh5 train-all and evaluation. The run selected
  epoch `18` via explicit `best_validation`, but failed to improve over M3CJ:
  validation accuracy stayed flat at `0.2` for all 20 epochs, final train
  accuracy was `0.176`, test top-1 remained `0.2`, macro F1 remained
  `0.06666666666666668`, validation/test prediction distribution collapsed to
  `morning: 125`, and test recall was zero for `home`, `pen`, `thank_you`, and
  `who`. It kept Brev, export readiness, browser activation, model-card
  promotion, final claims, source/register mutation, manifest/tensor mutation,
  unsupported claims, and push unjustified, and selected
  `continue_no_training_local_train_all_result_diagnosis`;
- active M3CS prompt:
  [`docs/model/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-goal-loop-prompt.md`](return-to-form-popsign-fresh5-local-train-all-result-diagnosis-goal-loop-prompt.md);
- M3CS required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json);
- M3CS objective: complete exactly one local/no-spend, no-training,
  no-mutation diagnosis of the completed M3CR train-all result from existing
  receipts, output artifacts, and code paths. The packet must classify whether
  the failure is best explained by artifact/reporting mismatch,
  train/eval/checkpoint behavior, logits/confidence collapse, data/split/source
  generalization, architecture/input limits, or code-path review need before
  any further fitting, Brev compute, export, browser activation, or final claim
  change;
- exact M3CS next action choices:
  `continue_no_training_local_train_all_result_diagnosis`,
  `continue_no_training_prediction_confidence_logit_distribution_packet`,
  `continue_no_training_train_eval_artifact_reconciliation_packet`,
  `continue_no_training_architecture_data_generalization_failure_packet`,
  or `stop_for_human_training_scope_budget_or_code_path_decision`;
- M3CS result: commit `f4b069d` completed the no-training local train-all
  result diagnosis. It found no artifact/command/checkpoint-selection mismatch
  and classified threshold selection as downstream of top-1 collapse. The
  strongest signal is near-uniform low-margin output behavior: validation/test
  predictions are all `morning`, top-2 is all `thank_you`, confidence is about
  `0.21009`, entropy is within about `0.00138` of `ln(5)`, and margins are
  about `0.0026`. It kept another fitting run, Brev compute, export readiness,
  source/manifest/tensor mutation, browser activation, model-card promotion,
  final claims, unsupported claims, and push unjustified, and selected
  `continue_no_training_prediction_confidence_logit_distribution_packet`;
- active M3CT prompt:
  [`docs/model/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-packet-goal-loop-prompt.md`](return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-packet-goal-loop-prompt.md);
- M3CT required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json`](../validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json);
- M3CT objective: complete exactly one local/no-spend, no-training,
  inference-only prediction confidence/logit distribution packet for the
  completed M3CR checkpoint and repaired manifests. It must inspect whether
  retained artifacts already include raw logits/full per-class probabilities,
  derive split-level train/validation/test confidence, entropy, margin,
  top-1/top-2, and raw-logit behavior when available, and classify whether the
  deterministic `morning` argmax is best explained by train-vs-held-out
  behavior, a tiny class-wise offset, reporting/evaluation extraction, model
  parameter state, architecture/data generalization, or remains inconclusive.
  It must not fit, train, create checkpoints, run Brev, mutate source/
  manifests/tensors, export, promote, change architecture/input representation,
  change final gates, or push;
- exact M3CT next action choices:
  `continue_no_training_prediction_confidence_logit_distribution_packet`,
  `continue_no_training_train_split_logit_or_feature_separability_packet`,
  `continue_no_training_last_layer_bias_parameter_packet`,
  `continue_no_training_architecture_data_generalization_failure_packet`,
  `escalate_strategy_research_with_local_evidence`,
  or `stop_for_human_training_scope_budget_or_code_path_decision`;
- M3CT result: commit `2d5ca51` completed the inference-only prediction
  confidence/logit distribution packet. Retained M3CR artifacts did not include
  raw logits, full per-class probabilities, or train predictions, so the
  executor added a scoped no-training helper and wrote ignored diagnostic output
  hash `e67871470618ee2f434f83408a7ec6d86b91576322a6650414d18fc9691206f8`.
  Train, validation, and test all collapse identically to `morning: 125`
  top-1 and `thank_you: 125` top-2; stable order is
  `morning > thank_you > who > pen > home`; top logit gap is about `0.0125`;
  probability gap is about `0.0026`; and classifier bias alone does not explain
  `morning` because bias ranks `morning` fourth. It kept another fitting run,
  Brev compute, architecture/input change, export readiness, source/manifest/
  tensor mutation, browser activation, model-card promotion, final claims,
  unsupported claims, and push unjustified, and selected
  `continue_no_training_train_split_logit_or_feature_separability_packet`;
- active M3CU prompt:
  [`docs/model/return-to-form-popsign-fresh5-train-split-logit-feature-separability-packet-goal-loop-prompt.md`](return-to-form-popsign-fresh5-train-split-logit-feature-separability-packet-goal-loop-prompt.md);
- M3CU required receipt:
  [`docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json`](../validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json);
- M3CU objective: complete exactly one local/no-spend, no-training train-split
  logit/feature separability packet for the completed M3CR checkpoint and
  repaired manifests. It must inspect whether train-split pre-head features are
  separable, collapsed, or inconclusive by true label, using only descriptive
  inference statistics such as feature norms, variance, centroids, within-label
  and between-label distances, and non-optimized nearest-centroid diagnostics if
  useful. It must not fit, train, create checkpoints, optimize an auxiliary
  classifier, run Brev, mutate source/manifests/tensors, export, promote,
  change architecture/input representation, change final gates, or push;
- exact M3CU next action choices:
  `continue_no_training_train_split_logit_or_feature_separability_packet`,
  `continue_no_training_last_layer_bias_parameter_packet`,
  `continue_no_training_feature_collapse_representation_packet`,
  `continue_no_training_architecture_data_generalization_failure_packet`,
  `escalate_strategy_research_with_local_evidence`,
  or `stop_for_human_training_scope_budget_or_code_path_decision`;
- partial M3BM lesson replay work is preserved in stash
  `paused m3bm lesson replay after ml-data redirect` and is not the active
  route.

Historical M3BM context:

- M3BL completed artifact:
  [`docs/research/semlex-source-register-candidate-no-import-v1.json`](../research/semlex-source-register-candidate-no-import-v1.json);
- M3BL result: commit `7311c93` completed the local/no-spend, no-import
  SemLex / ASL-LEX source-register candidate proposal. ASL-LEX video use
  remains blocked, SemLex is absent from the source register, no repo-local
  non-media metadata or phonology surface exists, no source-register edit was
  made, all fail-closed claim surfaces were preserved, and the artifact
  selected `escalate_strategy_research`;
- observer strategy escalation:
  [`artifacts/research/observer-357-post-semlex-strategy-api-response.md`](../../artifacts/research/observer-357-post-semlex-strategy-api-response.md);
- observer escalation result: Brev, training, source work, Detector 0 repair,
  vocabulary/data repair, SemLex/ASL-LEX continuation, and browser recognition
  activation are not authorized for the next slice. The selected bounded next
  mission is a local-only no-ML `/lesson` practice/replay workflow for
  self/human review;
- historical M3BM prompt:
  [`docs/model/return-to-form-lesson-local-practice-replay-no-ml-goal-loop-prompt.md`](return-to-form-lesson-local-practice-replay-no-ml-goal-loop-prompt.md);
- historical M3BM required receipt:
  [`docs/validation/return-to-form-lesson-local-practice-replay-no-ml-v1.json`](../validation/return-to-form-lesson-local-practice-replay-no-ml-v1.json);
- historical M3BM objective: complete exactly one local/no-spend, no-ML `/lesson`
  product slice that lets a learner record a short bounded in-session practice
  clip, replay it locally, retake it, and clear it. The clip must remain local
  and ephemeral, with no upload, persistence, export/share/download, analysis,
  recognition, tracking, scoring, validation, or ASL correctness claim;
- approved source route: `asl-citizen-school-assignment-raw-videos`;
- selected import:
  [`docs/research/asl-citizen-selected-raw-clip-import.json`](../research/asl-citizen-selected-raw-clip-import.json);
- source review:
  [`docs/research/asl-citizen-academic-source-review.md`](../research/asl-citizen-academic-source-review.md);
- refreshed diagnostic manifests:
  `data/manifests/diagnostics/asl-citizen-selected/{train,validation,test}.json`;
- strict lesson manifests:
  `data/manifests/lesson/rawframe-milestone/{train,validation,test}.json`;
- evidence receipt:
  [`docs/validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json`](../validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json);
- dry-run gate passed:
  `python3 scripts/train_rawframe_model.py --lesson-milestone --check-files --dry-run`
  against the strict lesson-manifest paths and
  `artifacts/rawframe-lesson-milestone`;
- selected ASL Citizen split counts: train 300 clips / 29 participants /
  min 12 clips per label, validation 94 clips / 5 participants / min 3 clips
  per label, test 100 clips / 7 participants / min 4 clips per label;
- M3AM diagnosis:
  [`docs/validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json`](../validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json);
- selected next action: `reduce_to_high_signal_5_10_sign_module`;
- active M3AN prompt:
  [`docs/model/return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md);
- high-signal module selection:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json);
- selected high-signal module: `table`, `please`, `black`, `hello`, `uncle`,
  `white`, and `sad`;
- completed M3AN next action:
  `materialize_high_signal_module_manifests_and_gates`;
- completed M3AO prompt:
  [`docs/model/return-to-form-asl-citizen-high-signal-manifest-gates-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-manifest-gates-goal-loop-prompt.md);
- high-signal reduced manifests:
  `data/manifests/lesson/high-signal-module/{train,validation,test}.json`;
- high-signal manifest/gate receipt:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json);
- selected next action:
  `add_reduced_real_data_manifest_contract`;
- active M3AP prompt:
  [`docs/model/return-to-form-asl-citizen-reduced-real-data-contract-goal-loop-prompt.md`](return-to-form-asl-citizen-reduced-real-data-contract-goal-loop-prompt.md);
- reduced real-data contract receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json`](../validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json);
- reduced real-data contract result: `--reduced-real-data-module --check-files
  --dry-run` passed on the high-signal manifests, and the mode rejects both
  non-dry-run execution and `--allow-small-label-set`;
- selected next action:
  `stop_for_reduced_module_training_scope_decision`;
- active M3AQ prompt:
  [`docs/model/return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md`](return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md);
- M3AQ completed selected action:
  `add_reduced_module_training_smoke_contract_and_run_local_mps_probe`;
- M3AQ receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json);
- M3AQ result: local MPS reduced-module training smoke completed for 3 epochs
  from random initialization with epoch 3 train accuracy
  `0.4642857142857143`, validation accuracy `0.25925925925925924`, test
  top-1 `0.21428571428571427`, and test macro-F1
  `0.12558869701726846`; this is not final, lesson, threshold, ONNX,
  model-card, browser, or readiness evidence;
- M3AQ selected next action:
  `stop_for_reduced_module_training_smoke_review`;
- active M3AR prompt:
  [`docs/model/return-to-form-overnight-recovery-and-brev-unblock-goal-loop-prompt.md`](return-to-form-overnight-recovery-and-brev-unblock-goal-loop-prompt.md);
- M3AR completed selected action:
  `classify_brev_auth_run_product_qa_and_write_overnight_recovery_decision`;
- M3AR receipt:
  [`docs/validation/return-to-form-overnight-recovery-decision-v1.json`](../validation/return-to-form-overnight-recovery-decision-v1.json);
- M3AR result: Brev remains blocked on logged-out EOF/human NVIDIA 2FA, so no
  worker inspection or paid compute ran; product QA passed for `/`, `/lesson`,
  and `/validation`; `/validation` claim-matrix copy now reflects Mission 3AR
  and M3AQ weak metrics while preserving `active_cv_claim=null` and
  `not_trained` browser status;
- M3AR selected next action:
  `continue_product_first_fail_closed_demo_polish_no_spend`;
- M3AR follow-up product QA completed enough local fail-closed housekeeping:
  validation ledger polish, lesson auth-gate smoke, practice scope-copy audit,
  and browser ONNX smoke receipt refresh all passed without changing the
  `not_trained` browser model state;
- active M3AS prompt:
  [`docs/model/return-to-form-composable-recognizer-contract-goal-loop-prompt.md`](return-to-form-composable-recognizer-contract-goal-loop-prompt.md);
- M3AS required receipt:
  [`docs/validation/return-to-form-composable-recognizer-contract-v1.json`](../validation/return-to-form-composable-recognizer-contract-v1.json);
- M3AS objective: prove the current composable recognizer/data contract from
  existing code, manifests, and tensors before any more training-style retry;
  record implemented architecture inventory, true-TCN status, high-signal
  tensor payload evidence, `rgb_regions` loader behavior, Brev auth state, and
  exactly one next action;
- exact next action choices:
  `run_capped_local_composable_smoke`,
  `add_tcn_or_multistream_contract_scaffold`, `stop_for_brev_2fa`,
  `stop_for_source_or_annotation_decision`, or
  `stop_for_human_demo_review`;
- M3AS completed receipt:
  [`docs/validation/return-to-form-composable-recognizer-contract-v1.json`](../validation/return-to-form-composable-recognizer-contract-v1.json);
- M3AS result: Brev remains blocked on logged-out EOF/human auth, so no paid
  compute or worker state was used; implemented architectures are the frame-mean
  2D baseline, compact 3D CNN, compact 3D CNN with clip normalization,
  factorized 3D CNN, and `motion_2d_temporal_cnn`; no true named TCN is
  implemented; sampled train/validation/test high-signal ASL Citizen tensors
  expose `rgb_frames` only, so the loader falls back to `rgb_frames` rather than
  consuming `rgb_regions`;
- M3AS retained contrast: the older PopSign Tier0 fixed-crop tensor contract
  still proves the `rgb_regions` -> `rgb_regions_grid_v1` loader path when
  region tensors exist, but that path is not present in the sampled selected
  high-signal ASL Citizen tensors;
- M3AS selected next action:
  `add_tcn_or_multistream_contract_scaffold`;
- active M3AT prompt:
  [`docs/model/return-to-form-tcn-multistream-contract-scaffold-goal-loop-prompt.md`](return-to-form-tcn-multistream-contract-scaffold-goal-loop-prompt.md);
- M3AT required receipt:
  [`docs/validation/return-to-form-tcn-multistream-contract-scaffold-v1.json`](../validation/return-to-form-tcn-multistream-contract-scaffold-v1.json);
- M3AT objective: add a no-training input-contract scaffold or equivalent
  audit path that distinguishes honest `rgb_frames` fallback from required
  `rgb_regions_grid_v1` region-grid input before future smoke/training;
- exact next action choices:
  `materialize_high_signal_region_grid_tensors`,
  `add_true_tcn_architecture_scaffold`, `run_capped_local_contract_smoke`,
  `stop_for_source_or_region_annotation_decision`, or `stop_for_brev_2fa`;
- M3AT completed receipt:
  [`docs/validation/return-to-form-tcn-multistream-contract-scaffold-v1.json`](../validation/return-to-form-tcn-multistream-contract-scaffold-v1.json);
- M3AT result: `scripts/train_rawframe_model.py` now has an explicit
  no-training `--require-input-contract` dry-run/check-files guard for
  `rgb_frames_fallback` versus `rgb_regions_grid_v1`; the selected high-signal
  ASL Citizen manifests pass only when fallback is explicitly required
  (`139/139` clips) and fail before training when `rgb_regions_grid_v1` is
  required;
- M3AT true-TCN decision:
  `not_added_yet`;
- M3AT selected next action:
  `materialize_high_signal_region_grid_tensors`;
- active M3AU prompt:
  [`docs/model/return-to-form-high-signal-region-grid-materialization-goal-loop-prompt.md`](return-to-form-high-signal-region-grid-materialization-goal-loop-prompt.md);
- M3AU required receipt:
  [`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`](../validation/return-to-form-high-signal-region-grid-materialization-v1.json);
- M3AU objective: materialize, verify, or precisely block high-signal ASL
  Citizen `rgb_regions` tensors from existing approved raw videos and the
  fixed-crop config so the selected manifests can satisfy
  `rgb_regions_grid_v1` before TCN, smoke, Brev, or promotion work;
- exact next action choices:
  `add_true_tcn_architecture_scaffold`,
  `run_capped_local_region_grid_smoke`,
  `stop_for_region_grid_source_or_schema_decision`, or `stop_for_brev_2fa`;
- M3AU completed receipt:
  [`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`](../validation/return-to-form-high-signal-region-grid-materialization-v1.json);
- M3AU result: `scripts/materialize_high_signal_region_grid.py --write`
  materialized ignored high-signal ASL Citizen region-grid manifests/tensors
  under `data/manifests/lesson/high-signal-region-grid/` and
  `data/tensors/asl-citizen-high-signal-region-grid/`; tensor counts are train
  `84`, validation `27`, and test `28`, with `139/139` selected clips
  observing `rgb_regions_grid_v1` and no missing tensor files;
- M3AU selected next action:
  `add_true_tcn_architecture_scaffold`;
- active M3AV prompt:
  [`docs/model/return-to-form-true-tcn-architecture-scaffold-goal-loop-prompt.md`](return-to-form-true-tcn-architecture-scaffold-goal-loop-prompt.md);
- M3AV required receipt:
  [`docs/validation/return-to-form-true-tcn-architecture-scaffold-v1.json`](../validation/return-to-form-true-tcn-architecture-scaffold-v1.json);
- M3AV objective: add, verify, or precisely block a compile-only true
  TCN/TemporalConvNet architecture scaffold for the generated high-signal
  `rgb_regions_grid_v1` region-grid recognizer path before any capped smoke,
  Brev run, export, or promotion work;
- exact next action choices:
  `run_capped_local_region_grid_tcn_smoke`,
  `run_capped_local_region_grid_motion_cnn_smoke`,
  `stop_for_architecture_scope_decision`, or `stop_for_brev_2fa`;
- M3AV completed receipt:
  [`docs/validation/return-to-form-true-tcn-architecture-scaffold-v1.json`](../validation/return-to-form-true-tcn-architecture-scaffold-v1.json);
- M3AV result: `scripts/train_rawframe_model.py` now exposes
  `true_temporal_convnet_region_grid`, a random-initialized residual causal
  dilated TemporalConvNet architecture. The compile-only receipt instantiated
  the model, ran one eval/no-grad forward pass on generated
  `rgb_regions_grid_v1` tensors with input shape `[2,16,3,96,96]`, produced
  logits shape `[2,7]`, and kept `139/139` selected clips on the
  `rgb_regions_grid_v1` input contract in dry-run/check-files mode;
- M3AV selected next action:
  `run_capped_local_region_grid_tcn_smoke`;
- active M3AW prompt:
  [`docs/model/return-to-form-region-grid-tcn-local-smoke-goal-loop-prompt.md`](return-to-form-region-grid-tcn-local-smoke-goal-loop-prompt.md);
- M3AW required receipt:
  [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json);
- M3AW objective: run, verify, or precisely block exactly one capped local
  no-spend smoke for `true_temporal_convnet_region_grid` on the generated
  high-signal ASL Citizen `rgb_regions_grid_v1` manifests, with narrow
  script-contract caps if the current training CLI lacks a region-grid smoke
  policy. The smoke must preserve region identity from `rgb_regions`; the
  current mosaic-plus-resize path (`[T,192,288,3]` to `[T,3,96,96]`) is a
  blocker unless an adapter or equivalent proof is added first;
- exact next action choices:
  `continue_region_grid_tcn_smoke_evaluation_diagnosis`,
  `stop_for_local_tcn_smoke_review`,
  `stop_for_region_grid_smoke_contract_blocker`, or `stop_for_brev_2fa`;
- M3AW completed receipt:
  [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json);
- M3AW result: commit `783c579` ran the one authorized capped local/no-spend
  region-grid TCN smoke. The model input preserved region identity as
  `B,T,R,C,H,W` with batched shape `[2,16,5,3,96,96]`, but target metrics
  failed (`validation_top1_accuracy=0.037037037037037035`,
  `test_top1_accuracy=0.17857142857142858`, `test_macro_f1=0.09166666666666666`);
- M3AW selected next action:
  `stop_for_local_tcn_smoke_review`;
- observer STOP:
  [`docs/session-logs/323-observer-stop-local-tcn-smoke-review.md`](../session-logs/323-observer-stop-local-tcn-smoke-review.md)
  halted the loop for human ML/scope review. No second local training attempt,
  Brev action, export, browser activation, or final-gate change is authorized
  by the stopped M3AW prompt;
- post-M3AW API strategy memo:
  [`artifacts/research/observer-324-post-m3aw-strategy-api-response.md`](../../artifacts/research/observer-324-post-m3aw-strategy-api-response.md);
- active M3AX prompt:
  [`docs/model/return-to-form-region-grid-tcn-tiny-overfit-goal-loop-prompt.md`](return-to-form-region-grid-tcn-tiny-overfit-goal-loop-prompt.md);
- M3AX required receipt:
  [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json);
- M3AX objective: run, verify, or precisely block exactly one local/no-spend
  tiny deterministic memorization sanity probe for
  `true_temporal_convnet_region_grid` on existing high-signal ASL Citizen
  `rgb_regions_grid_v1` tensors. This distinguishes a structurally broken
  model/input/training path from a broader data/vocabulary/crop generalization
  problem before any more training or Brev spend;
- exact next action choices:
  `continue_vocab_crop_separability_diagnosis_no_training`,
  `stop_training_lane_for_representation_backtrack`, or
  `stop_for_tiny_overfit_contract_blocker`;
- M3AX completed receipt:
  [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json);
- M3AX result: commit `3075cd9` ran the one authorized local/no-spend tiny
  overfit probe on a deterministic seven-clip subset. The model input preserved
  region identity as `B,T,R,C,H,W` with batched shape `[7,16,5,3,96,96]`, and
  the recovered final checkpoint reached subset accuracy `1.0` with zero-recall
  labels `[]`;
- M3AX selected next action:
  `continue_vocab_crop_separability_diagnosis_no_training`;
- active M3AY prompt:
  [`docs/model/return-to-form-vocab-crop-separability-diagnosis-goal-loop-prompt.md`](return-to-form-vocab-crop-separability-diagnosis-goal-loop-prompt.md);
- M3AY required receipt:
  [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json);
- M3AY objective: run, verify, or precisely block exactly one local/no-spend,
  no-training diagnosis of vocabulary, crop/region, split, signer, and
  data-quality factors explaining why tiny memorization succeeded while M3AW
  held-out generalization failed. This mission may use existing manifests,
  tensors, receipts, reports, and sidecars only;
- exact next action choices:
  `continue_no_training_vocab_or_crop_remediation_design`,
  `continue_product_fallback_scope_design_no_training`,
  `stop_for_human_ml_scope_decision`, or
  `stop_for_separability_diagnosis_blocker`;
- M3AY completed receipt:
  [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json);
- M3AY result: commit `5c8befd` completed the authorized local/no-spend,
  no-training diagnosis. The receipt keeps M3AX tiny memorization separate from
  M3AW held-out success, records M3AW prediction collapse to three labels on
  validation and test, records never-predicted held-out labels `please`, `sad`,
  `table`, and `white`, records empty train/validation and train/test signer
  overlap, and records ten split-label descriptive crop-stat drift failures;
- M3AY selected next action:
  `continue_no_training_vocab_or_crop_remediation_design`;
- active M3AZ prompt:
  [`docs/model/return-to-form-vocab-crop-remediation-design-goal-loop-prompt.md`](return-to-form-vocab-crop-remediation-design-goal-loop-prompt.md);
- M3AZ required receipt:
  [`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`](../validation/return-to-form-vocab-crop-remediation-design-v1.json);
- M3AZ objective: convert the M3AY diagnosis and existing M3AW/M3AX artifacts
  into exactly one no-training remediation design lane across
  vocabulary/subset choice, crop/region signal, signer/split generalization,
  data quality, or fail-closed product fallback before any future training or
  Brev work;
- exact next action choices:
  `continue_no_training_remediation_contract_scaffold`,
  `continue_product_fallback_scope_design_no_training`,
  `stop_for_human_ml_scope_decision`, or
  `stop_for_remediation_design_blocker`;
- M3AZ completed receipt:
  [`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`](../validation/return-to-form-vocab-crop-remediation-design-v1.json);
- M3AZ result: commit `d3acd42` completed the authorized local/no-spend,
  no-training remediation design. It selected `split_signer_contract` because
  empty train-to-held-out signer overlap plus prediction collapse must be
  resolved before another training prompt. Ranked alternatives were
  `crop_region_contract`, `vocab_subset_contract`, `data_quality_contract`,
  and `product_fallback_scope`;
- M3AZ selected next action:
  `continue_no_training_remediation_contract_scaffold`;
- active M3BA prompt:
  [`docs/model/return-to-form-split-signer-contract-goal-loop-prompt.md`](return-to-form-split-signer-contract-goal-loop-prompt.md);
- M3BA required receipt:
  [`docs/validation/return-to-form-split-signer-contract-v1.json`](../validation/return-to-form-split-signer-contract-v1.json);
- M3BA objective: turn the selected split/signer remediation lane into a
  no-training contract that records signer support, the intended
  generalization target, label retain/hold/drop/repair decisions, crop/region
  gate requirements or deferral, stop conditions, and exactly one next action;
- exact next action choices:
  `continue_no_training_crop_region_contract_scaffold`,
  `continue_no_training_vocab_subset_contract_scaffold`,
  `continue_product_fallback_scope_design_no_training`,
  `stop_for_human_ml_scope_decision`, or
  `stop_for_split_signer_contract_blocker`;
- M3BA completed receipt:
  [`docs/validation/return-to-form-split-signer-contract-v1.json`](../validation/return-to-form-split-signer-contract-v1.json);
- M3BA result: commit `d26fed2` completed the authorized local/no-spend,
  no-training split/signer contract. It verified `139` manifest-bound tensors,
  selected `signer_disjoint` as diagnostic-only until crop/region and
  label-level gates pass, recorded train/validation/test signer overlap `[]`,
  and held `please`, `sad`, `table`, and `white` for repair before any next
  training prompt;
- M3BA selected next action:
  `continue_no_training_crop_region_contract_scaffold`;
- active M3BB prompt:
  [`docs/model/return-to-form-crop-region-contract-goal-loop-prompt.md`](return-to-form-crop-region-contract-goal-loop-prompt.md);
- M3BB required receipt:
  [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json);
- M3BB objective: turn the crop/region blocker into a no-training contract
  that verifies preserved `rgb_regions_grid_v1` input, records per-label and
  per-split crop/region quality summaries, resolves or holds the M3AY
  crop-stat drift failures, defines gates before future training, and selects
  exactly one next action;
- exact next action choices:
  `continue_no_training_vocab_subset_contract_scaffold`,
  `continue_bounded_brev_microexperiment_compute_receipt`,
  `continue_product_fallback_scope_design_no_training`,
  `stop_for_brev_auth_required`,
  `stop_for_human_ml_scope_decision`, or
  `stop_for_crop_region_contract_blocker`;
- M3BB may hand off to
  [`docs/model/return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md`](return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md)
  if the crop/region contract identifies a training-worthy retained subset or
  ablation and the next step is a human-approved paid micro-experiment with a
  compute receipt before remote execution. If Brev remains blocked by
  NVIDIA/Brev login or 2FA, the exact next action is
  `stop_for_brev_auth_required`;
- M3BB completed receipt:
  [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json);
- M3BB result: commit `451a6c2` completed the authorized local/no-spend,
  no-training crop/region contract. It verified preserved
  `rgb_regions_grid_v1` input for all `139` manifest-bound tensors, recorded
  per-label/per-split crop/region summaries, kept the ten M3AY crop-stat drift
  failures unresolved, and did not identify a training-worthy paid Brev
  micro-experiment;
- M3BB selected next action:
  `continue_no_training_vocab_subset_contract_scaffold`;
- active M3BC prompt:
  [`docs/model/return-to-form-vocab-subset-contract-goal-loop-prompt.md`](return-to-form-vocab-subset-contract-goal-loop-prompt.md);
- M3BC required receipt:
  [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json);
- M3BC objective: turn the retained/held/repair/drop vocabulary blocker into a
  no-training contract that records per-label split support, signer-disjoint
  implications, relationship to M3AY never-predicted/drift evidence, a smallest
  honest candidate subset if any, gates before future training, and exactly one
  next action;
- exact next action choices:
  `continue_no_training_data_quality_contract_scaffold`,
  `continue_bounded_brev_microexperiment_compute_receipt`,
  `continue_product_fallback_scope_design_no_training`,
  `stop_for_brev_auth_required`,
  `stop_for_human_ml_scope_decision`, or
  `stop_for_vocab_subset_contract_blocker`;
- M3BC completed receipt:
  [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json);
- M3BC result: commit `5093aa0` completed the authorized local/no-spend,
  no-training vocabulary subset contract. It found no label currently clears
  all M3BA/M3BB gates for training, recorded candidate subset status
  `none_currently_training_ready`, retained labels `[]`, held `please`, `sad`,
  `table`, and `white`, marked `uncle` as repair-required, deferred `black`
  and `hello`, and did not support a paid Brev micro-experiment;
- M3BC selected next action:
  `continue_no_training_data_quality_contract_scaffold`;
- active M3BD prompt:
  [`docs/model/return-to-form-data-quality-contract-goal-loop-prompt.md`](return-to-form-data-quality-contract-goal-loop-prompt.md);
- M3BD required receipt:
  [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json);
- M3BD objective: turn the data quality and repair blocker into a no-training
  contract that records per-label data quality, support, low-signal/crop
  evidence, repairability decisions from existing artifacts, candidate subset
  evidence if any, gates before future training, and exactly one next action;
- exact next action choices:
  `continue_bounded_brev_microexperiment_compute_receipt`,
  `continue_product_fallback_scope_design_no_training`,
  `stop_for_brev_auth_required`,
  `stop_for_human_data_quality_repair`,
  `stop_for_human_ml_scope_decision`, or
  `stop_for_data_quality_contract_blocker`;
- M3BD completed receipt:
  [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json);
- M3BD result: commit `9516634` completed the authorized local/no-spend,
  no-training data quality contract. Existing artifacts do not repair any
  held, deferred, or repair-required label into a training-worthy retained
  candidate; all seven high-signal labels remain excluded from future training;
  retained labels are `[]`; and a paid Brev micro-experiment is not supported;
- M3BD selected next action:
  `continue_product_fallback_scope_design_no_training`;
- active M3BE prompt:
  [`docs/model/return-to-form-product-fallback-scope-design-goal-loop-prompt.md`](return-to-form-product-fallback-scope-design-goal-loop-prompt.md);
- M3BE required receipt:
  [`docs/validation/return-to-form-product-fallback-scope-design-v1.json`](../validation/return-to-form-product-fallback-scope-design-v1.json);
- M3BE objective: convert the M3BD no-training data quality result and current
  fail-closed product claim surfaces into an honest product fallback scope
  design while the browser model remains `not_trained`;
- exact next action choices:
  `continue_product_interactive_integration_no_promotion`,
  `continue_final_readiness_gap_audit_no_promotion`,
  `stop_for_human_product_scope_decision`,
  `stop_for_human_data_or_ml_repair`, or
  `stop_for_fallback_scope_design_blocker`;
- M3BE completed receipt:
  [`docs/validation/return-to-form-product-fallback-scope-design-v1.json`](../validation/return-to-form-product-fallback-scope-design-v1.json);
- M3BE result: commit `061a54d` completed the authorized local/no-spend,
  no-training product fallback scope design. Browser model status remains
  `not_trained`, active labels remain `[]`, active CV claim remains `null`,
  browser recognition and Detector 0 tracking remain disabled, and the honest
  fallback scope is learn-only/local camera UX, metadata-only fail-closed
  attempts, progress/history, lesson timing/demo scaffold, and validation
  transparency;
- M3BE selected next action:
  `continue_product_interactive_integration_no_promotion`;
- active M3BF prompt:
  [`docs/model/return-to-form-product-interactive-integration-no-promotion-goal-loop-prompt.md`](return-to-form-product-interactive-integration-no-promotion-goal-loop-prompt.md);
- M3BF required receipt:
  [`docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-product-interactive-integration-no-promotion-v1.json);
- M3BF objective: implement exactly one bounded fail-closed product
  interactive integration slice from the M3BE allowed scope while preserving
  `not_trained` model/card/claim surfaces and no positive recognition outcome;
- exact next action choices:
  `continue_product_interactive_integration_no_promotion`,
  `continue_final_readiness_gap_audit_no_promotion`,
  `stop_for_human_product_review`,
  `stop_for_human_data_or_ml_repair`, or
  `stop_for_product_integration_blocker`;
- M3BF completed receipt:
  [`docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-product-interactive-integration-no-promotion-v1.json);
- M3BF result: commit `6ee002c` completed exactly one authorized
  local/no-spend fail-closed product surface, `practice`. It changed practice
  history presentation so saved metadata-only attempts render as history rather
  than pass-style progress while the browser model is `not_trained`, and
  verified model-card, claim-matrix, active-vocabulary, browser bundle,
  Detector 0, and final-claim surfaces unchanged;
- M3BF selected next action:
  `continue_product_interactive_integration_no_promotion`;
- active M3BG prompt:
  [`docs/model/return-to-form-lesson-interactive-integration-no-promotion-goal-loop-prompt.md`](return-to-form-lesson-interactive-integration-no-promotion-goal-loop-prompt.md);
- M3BG required receipt:
  [`docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json);
- M3BG objective: implement exactly one bounded fail-closed lesson integration
  slice from the M3BE allowed scope while preserving `not_trained`
  model/card/claim surfaces, disabled Detector 0 tracking, no box-driven
  avatar authority, and no positive recognition outcome;
- exact next action choices:
  `continue_product_interactive_integration_no_promotion`,
  `continue_final_readiness_gap_audit_no_promotion`,
  `stop_for_human_product_review`,
  `stop_for_human_data_or_ml_repair`, or
  `stop_for_lesson_integration_blocker`;
- M3BG completed receipt:
  [`docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json);
- M3BG result: commit `e4bb060` completed exactly one authorized
  local/no-spend fail-closed product surface, `lesson`. It added a
  Study / Preview / Sample prompt study flow on `/lesson` while the browser
  model is `not_trained`, and verified model-card, claim-matrix,
  active-vocabulary, browser bundle, Detector 0, and final-claim surfaces
  unchanged;
- M3BG selected next action:
  `continue_product_interactive_integration_no_promotion`;
- active M3BH prompt:
  [`docs/model/return-to-form-validation-interactive-integration-no-promotion-goal-loop-prompt.md`](return-to-form-validation-interactive-integration-no-promotion-goal-loop-prompt.md);
- M3BH required receipt:
  [`docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-validation-interactive-integration-no-promotion-v1.json);
- M3BH objective: implement exactly one bounded fail-closed validation
  transparency slice from the M3BE allowed scope while preserving
  `not_trained` model/card/claim surfaces, disabled Detector 0 tracking, no
  box-driven avatar authority, no final validation promotion, and no positive
  recognition outcome;
- exact next action choices:
  `continue_final_readiness_gap_audit_no_promotion`,
  `stop_for_human_product_review`,
  `stop_for_human_data_or_ml_repair`, or
  `stop_for_validation_integration_blocker`;
- M3BH completed receipt:
  [`docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-validation-interactive-integration-no-promotion-v1.json);
- M3BH result: commit `333b427` completed exactly one authorized
  local/no-spend fail-closed product surface, `validation`. It added a
  reviewer-facing evidence ledger for M3BE/M3BF/M3BG/M3BH receipts and public
  runtime claim JSON on `/validation`, while preserving the browser model
  `not_trained`, active labels `[]`, active CV claim `null`, claim surfaces,
  Detector 0 tracking disabled, no box-driven avatar authority, and no final
  validation promotion;
- M3BH selected next action:
  `continue_final_readiness_gap_audit_no_promotion`;
- active M3BI prompt:
  [`docs/model/return-to-form-final-readiness-gap-audit-no-promotion-goal-loop-prompt.md`](return-to-form-final-readiness-gap-audit-no-promotion-goal-loop-prompt.md);
- M3BI required receipt:
  [`docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json`](../validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json);
- M3BI objective: complete exactly one local/no-spend final readiness gap audit
  for the fail-closed product package without changing runtime behavior, claim
  surfaces, final gates, model artifacts, manifests/tensors, sources, Brev
  state, browser activation, final validation promotion, or final-readiness
  claims;
- exact next action choices:
  `continue_one_no_promotion_final_gap_fix`,
  `stop_for_human_product_review`,
  `stop_for_human_data_or_ml_repair`,
  `stop_for_brev_auth_required`, or
  `stop_for_final_gap_audit_blocker`;
- M3BI completed receipt:
  [`docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json`](../validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json);
- M3BI result: commit `c09e9e3` completed the final no-promotion gap audit,
  and observer commit `01c102a` stopped for human product review. The audit
  classified `/`, `/lesson`, and `/validation` as adequate for fail-closed
  review while preserving `model_card_status=not_trained`, `active_labels=[]`,
  `active_cv_claim=null`, browser recognition disabled, Detector 0 tracking
  disabled, and box-driven avatar disabled;
- active M3BJ prompt:
  [`docs/model/return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md`](return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md);
- M3BJ required receipt:
  [`docs/validation/return-to-form-post-review-ml-route-recovery-v1.json`](../validation/return-to-form-post-review-ml-route-recovery-v1.json);
- M3BJ objective: use the latest user continuation to leave the M3BI
  product-review stop state, classify Brev/NVIDIA auth with fresh command
  evidence, and if auth remains blocked by human password/2FA, still advance a
  local no-spend source/vocabulary/Detector 0/TCN route decision instead of
  falling back to product-only polish;
- exact next action choices:
  `continue_semlex_overlap_and_source_review_no_training`,
  `continue_detector0_annotation_or_schema_repair_no_brev`,
  `continue_vocab_data_repair_no_training`,
  `continue_bounded_local_model_probe_no_brev`,
  `escalate_strategy_research`,
  `stop_for_brev_password_or_2fa_required`, or
  `stop_for_human_source_or_annotation_required`;
- M3BJ completed receipt:
  [`docs/validation/return-to-form-post-review-ml-route-recovery-v1.json`](../validation/return-to-form-post-review-ml-route-recovery-v1.json);
- M3BJ result: commit `83c112b` classified Brev as
  `logged_out_prompt_eof`; no worker, price, process list, or budget state was
  inspectable; no paid compute, remote command, training, source import,
  claim-surface change, final-gate change, or push occurred. The receipt
  compared SemLex/ASL-LEX, PopSign/Tier-0, Detector 0, region-grid TCN, Brev
  compute, and product-only routes;
- M3BJ selected next action:
  `continue_semlex_overlap_and_source_review_no_training`;
- active M3BK prompt:
  [`docs/model/return-to-form-semlex-overlap-source-review-no-training-goal-loop-prompt.md`](return-to-form-semlex-overlap-source-review-no-training-goal-loop-prompt.md);
- M3BK required artifact:
  [`docs/research/semlex-asl-lex-overlap-source-review-v1.json`](../research/semlex-asl-lex-overlap-source-review-v1.json);
- M3BK objective: complete exactly one local/no-spend, no-training SemLex /
  ASL-LEX source and vocabulary-overlap review without source import, source
  approval changes, media download, SemLex training use, manifest/tensor
  mutation, Brev action, training, export, browser activation, final validation
  promotion, final-gate changes, or claim-surface edits;
- exact next action choices:
  `continue_semlex_source_register_candidate_no_import`,
  `continue_vocab_data_repair_no_training`,
  `continue_detector0_annotation_or_schema_repair_no_brev`,
  `continue_bounded_local_model_probe_no_brev`,
  `escalate_strategy_research`,
  `stop_for_human_source_approval`, or
  `stop_for_semlex_overlap_review_blocker`;
- M3BK completed artifact:
  [`docs/research/semlex-asl-lex-overlap-source-review-v1.json`](../research/semlex-asl-lex-overlap-source-review-v1.json);
- M3BK result: commit `4ef102d` completed the local/no-spend, no-training
  SemLex / ASL-LEX source and vocabulary-overlap review. ASL-LEX video use
  remains blocked, SemLex is absent from the source register, no repo-local
  SemLex/ASL-LEX/phonology artifact exists, and the current 100-item content
  vocabulary has `0` established overlap terms because no local external term
  surface exists;
- post-handoff Brev auth state: after the M3BK handoff, the human completed
  NVIDIA/Brev login in Safari and `brev ls --json` became authenticated.
  `asl-pilot-rawframe-001` / `2hl1hytty` still reports `RUNNING`. Repeated
  `brev stop` attempts by name, id, and `--all` return cleanly or print the
  workspace name, but fresh verification on 2026-05-27 still reports
  `instance_kind=gpu`, `gpu="A100"`, and
  `instance_type="massedcompute_A100_sxm4_80G_DGX"`. Treat this as a live
  provider/cost-control blocker until a later `brev ls --json` proves the GPU
  is detached or stopped. M3BM remains a no-Brev/no-training product slice;
  future compute prompts must re-check worker state, listed price, process
  list, max runtime/spend, kill condition, artifact copyback, and
  cleanup/default-off verification before any remote training.
- source/register hashes: source register
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`,
  selected import
  `9613276b10858cef6489676d4ce6765e487089aa5c9559e3982304e626f38b6f`,
  source review
  `f8295c8f498cc5ed3925b833ec51aa7799c4365118f69f0a57993ea27a538d94`;
- completed no-spend local smoke prompt:
  [`docs/model/return-to-form-asl-citizen-local-lesson-smoke-goal-loop-prompt.md`](return-to-form-asl-citizen-local-lesson-smoke-goal-loop-prompt.md);
- local smoke result: `39cedd0` completed one MPS epoch from random
  initialization with train accuracy `0.03` and validation accuracy
  `0.09574468085106383`;
- observer STOP: `e284e01` recorded that the next step needs a bounded
  Brev/full-training decision and that `asl-pilot-rawframe-001` / `2hl1hytty`
  still reports `RUNNING` after stop attempts;
- active bounded Brev training prompt:
  [`docs/model/return-to-form-asl-citizen-bounded-brev-training-goal-loop-prompt.md`](return-to-form-asl-citizen-bounded-brev-training-goal-loop-prompt.md);
- bounded Brev training receipt:
  [`docs/validation/return-to-form-asl-citizen-brev-training-v1.json`](../validation/return-to-form-asl-citizen-brev-training-v1.json);
- bounded Brev training result: `106e091` completed 40 CUDA epochs with
  `final_train_accuracy=0.9966666666666667`,
  `best_validation_accuracy=0.20212765957446807`, and no promotion/export;
- evaluation blocker: `data/manifests/negative-challenge.json` currently has
  5 clips each for `empty_camera`, `low_light`, `no_hands_visible`,
  `non_target_asl_sign`, and `off_center`, but lacks required coverage for the
  remaining evaluator challenge types, so no test or negative-challenge metrics
  were written;
- local core-negative diagnostic:
  [`docs/validation/return-to-form-asl-citizen-core-negative-diagnostic-v1.json`](../validation/return-to-form-asl-citizen-core-negative-diagnostic-v1.json);
- diagnostic report:
  [`artifacts/rawframe-lesson-milestone/core-negative-diagnostic-report.json`](../../artifacts/rawframe-lesson-milestone/core-negative-diagnostic-report.json);
- diagnostic result: `validation_top1_accuracy=0.20212765957446807`,
  `test_top1_accuracy=0.21`, `test_macro_f1=0.16913707345286294`,
  `core_negative_false_pass_rate=0.04` at threshold `0.99`, and no calibrated
  provenance written;
- current blocker classification: positive-class signer-disjoint
  generalization, not GPU availability and not the current five-type core
  negative set;
- provider blocker: Brev CLI auth expired after artifact copyback, so
  `brev ls --json` and stop attempts by name, id, and `--all` fail with
  logged-out EOF; final provider state is unknown after the last successful
  pre-run state of `RUNNING`;
- current command boundary: no Brev sync/exec/training/spend, no additional
  classifier/detector training, no export, no threshold promotion, no browser
  activation, and no final-readiness claim;
- active prompt:
  [`docs/model/return-to-form-asl-citizen-generalization-diagnosis-goal-loop-prompt.md`](return-to-form-asl-citizen-generalization-diagnosis-goal-loop-prompt.md);
- generalization diagnosis:
  [`docs/validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json`](../validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json);
- selected next action: `reduce_to_high_signal_5_10_sign_module`, to choose a
  smaller evidence-backed 5-10 sign module before any further training or Brev
  decision;
- next bounded prompt:
  [`docs/model/return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md`](return-to-form-asl-citizen-high-signal-module-selection-goal-loop-prompt.md).

### Historical Detector 0 Milestone

M3AE-AG - Detector 0 Two-Hand Union Training Smoke.

Current tactical target:

- selected Tier 0 labels: `please`, `table`, `dad`, `grandpa`, `hat`;
- source/coverage evidence:
  [`docs/research/return-to-form-tier0-source-coverage.json`](../research/return-to-form-tier0-source-coverage.json);
- fixed crop config:
  [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json);
- pre-training gates:
  [`docs/validation/return-to-form-tier0-gates.json`](../validation/return-to-form-tier0-gates.json);
- M3AD is closed: refreshed Tier 0 manifests/tensors bind the crop config hash
  and prove decode/dataloader correctness before training.
- M3AE ran exactly one smallest Tier 0 learnability smoke from random
  initialization and compared it against the pre-written gates. The proof did
  not pass train sanity.
- M3AE-R diagnosed the first concrete failure as a tensor payload/preprocessing
  contract mismatch.
- M3AE-F fixed and verified the input contract.
- M3AE-G reran the bounded Tier 0 smoke on the corrected
  `rgb_regions_grid_v1` path and failed train sanity plus validation signal.
- M3AE-H triaged the corrected-input failure and selected
  `model_architecture_microprobe`.
- M3AE-I ran one bounded no-label-expansion train-fit microprobe and passed on
  a tiny crop-identity-preserving subset.
- M3AE-J ran one bounded full-split smoke with the M3AE-I
  crop-identity-preserving configuration. Train sanity passed, but validation
  signal remained near random.
- M3AE-K ran one label/split/source-distribution diagnostic and classified the
  blocker as `source_signer_distribution_gap`, with no clip, source-record,
  signer-hash, or tensor-path overlap across train and validation/test.
- M3AE-N closed the first full packet review: 14 rows are now verified or
  corrected, and one held-out `hat` row is rejected for insufficient visual
  evidence.
- M3AE-O closed the annotation follow-up: the rejected held-out `hat` row was
  replaced with approved PopSign test row `det0-v0-test-hat-001503-f010`, and
  the packet now has 15 manual-verified or manual-corrected rows.
- M3AE-P closed one local no-spend scratch Detector 0 smoke on the verified
  packet, proving packet/tensor/target/loss/metric wiring without Brev compute.
- M3AE-Q closed the design-only fixed-crop versus detector-normalized
  comparison plan.
- M3AE-S closed one local no-spend ablation smoke. It passed Detector 0 train
  sanity, transform integrity, candidate train sanity, and validation
  comparison, but failed the per-target fallback gate because
  `right_or_second_hand` fallback was `0.8110507246376811` against the `0.60`
  cap.
- M3AE-T closed the read-only remediation diagnostic and selected a
  crop-normalization optional-target policy revision.
- M3AE-U defined the policy-only optional-target fallback artifact before any
  ablation rerun, detector/recognizer training, packet mutation,
  implementation-code edit, label expansion, broad evaluation, export, or
  product claim.
- M3AE-V applied the M3AE-U policy-aware fallback accounting to the retained
  local ablation evidence. Raw `right_or_second_hand` fallback remains
  `0.8110507246376811`; policy-aware gateable fallback is narrower
  (`928/17664`, overall `0.05253623188405797`) but still fails because the
  expected-present `table` right/second-hand miss rate is
  `0.8405797101449275` against the unchanged `0.60` per-target cap.
- M3AE-W closed the read-only remediation triage. The receipt
  [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json)
  classifies the remaining expected-present `table` right/second-hand miss
  rate as `packet_positive_support_scarcity`, with retained Detector 0
  optional-target generalization weakness as a secondary effect. The packet has
  only three reviewed table-positive second-hand rows, while M3AE-V recorded
  928 misses across 1104 expected-present table decisions.
- Exact next action:
  `detector0_table_second_hand_packet_expansion_design`.
- M3AE-X closed the design-only slice. The design artifact
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md)
  defines candidate criteria, split-balance targets, manual review rules,
  provenance requirements, and non-mutation boundaries for additional approved
  Tier 0 PopSign `table` right/second-hand support before any packet mutation,
  Detector 0 retraining, recognizer retraining, or ablation rerun.
- M3AE-Y closed the candidate-review slice. The candidate-review artifact
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md)
  records 17 candidate-scoped reviewed rows, accepted/rejected counts by split,
  packet unchanged proof, M3AE-V baseline, and M3AE-X target status. The target
  is met with 7 train, 7 validation, and 6 test candidate-or-existing reviewed
  positives.
- M3AE-Z closed the packet-mutation slice. The mutation receipt
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json)
  added 17 accepted M3AE-Y `table` right/second-hand rows to the approved
  Detector 0 packet, raising packet rows from 15 to 32 and table
  right/second-hand support to train 7, validation 7, and test 6. The receipt
  separates candidate sufficiency from target-schema risk and records
  `target_schema_assessment.status=bounded_smoke_usable`.
- Exact next action:
  `detector0_expanded_packet_training_smoke`.
- M3AE-AA closed the expanded-packet smoke slice. The smoke receipt
  [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json)
  records a local CPU scratch smoke on the expanded 32-row packet. Train-path
  sanity passed, but held-out `table` right/second-hand presence stayed weak
  (`validation=0.2857142984867096`, `test=0.3333333432674408`). The receipt
  classifies the next target as
  `needs_two_hand_union_or_contact_region_schema_revision`.
- Exact next action:
  `detector0_two_hand_union_schema_revision`.
- M3AE-AB closed the schema-design slice. The schema artifact
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md)
  defines `table_two_hand_union_or_contact_region` as a derived union/contact
  remediation target for `table` rows, using reviewed left/right boxes as
  evidence only and keeping packet mutation as the next no-training slice.
- M3AE-AC closed the packet-mutation slice. The mutation receipt
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json)
  added `table_two_hand_union_or_contact_region` target objects to all 32
  existing packet rows without adding rows. It derived 19 present `table`
  union/contact targets (train 6, validation 7, test 6), marked 12 non-table
  rows absent by label applicability, and left
  `det0-v0-train-table-000376-f010` unresolved because the required
  0.02-margin union width is `0.88`, above the M3AE-AB `0.85` threshold.
- Exact next action:
  `detector0_data_or_target_remediation`.
- M3AE-AD closed the remediation-classification slice. The remediation receipt
  [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json)
  classifies `det0-v0-train-table-000376-f010` as a
  `schema_threshold_margin_policy_issue`: the reviewed left/right boxes are
  present, normalized, manually corrected, and above the visibility threshold;
  the raw union width is `0.84`, but the M3AE-AB fixed `0.02` context margin
  expands it to `0.88`, above the `0.85` cap. No packet correction was made
  because doing so would silently reinterpret the schema margin/threshold rule.
- Exact next action:
  `detector0_two_hand_union_schema_revision`.
- M3AE-AE was queued to revise the union/contact margin or threshold semantics
  before any packet correction or union-target Detector 0 smoke, preserving
  no-packet-mutation, no-training, no-Brev-spend, no-source-import, and
  no-product-runtime boundaries.
- M3AE-AE closed the design-only margin schema revision. The schema revision
  artifact
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md)
  selects bounded adaptive context-margin semantics: reviewed source boxes and
  raw union hard limits remain unchanged, while the desired `0.02` context
  margin may be reduced per axis so the final derived target stays within the
  retained `0.85` width/height and `0.55` area caps. This resolves
  `det0-v0-train-table-000376-f010` by using `effective_margin_x=0.005` and
  `effective_margin_y=0.02`, yielding revised box
  `[0.015, 0.55, 0.865, 0.84]` without packet mutation in this slice.
- Exact next action:
  `detector0_two_hand_union_packet_mutation_continue`.
- M3AE-AF was queued to apply the bounded adaptive context-margin semantics to
  the existing approved Detector 0 packet rows before any union-target Detector
  0 smoke, preserving no-row-addition, no-training, no-Brev-spend,
  no-source-import, no-product-runtime, and no-broad-run boundaries.
- M3AE-AF closed the bounded packet-mutation continuation. The mutation receipt
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json)
  records packet hash
  `b0456313f78f0ddb9a4656876f2021046e4324f8cd06bc7a62021579ff56144f`
  to `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`,
  zero row additions, and one changed existing
  `table_two_hand_union_or_contact_region` target:
  `det0-v0-train-table-000376-f010` now has present revised box
  `[0.015, 0.55, 0.865, 0.84]` with `effective_margin_x=0.005` and
  `effective_margin_y=0.02`. Current union/contact support is train 7,
  validation 7, test 6, and unresolved table rows are zero.
- Exact next action:
  `detector0_two_hand_union_training_smoke`.
- M3AE-AG was queued to run one bounded local no-spend scratch Detector 0 smoke
  against the resolved `table_two_hand_union_or_contact_region` target before
  any crop-normalization ablation rerun or recognizer training.
- M3AE-AG closed the local CPU scratch smoke. The smoke receipt
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json)
  records packet hash
  `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`,
  split counts train 11 / validation 11 / test 10, union/contact support
  train 7 / validation 7 / test 6, local device `cpu`, and seed `223607`.
  Train presence fit reached `1.0`, but train union/contact box MAE was
  `0.18746726214885712` against the `0.15` train-path cap. Held-out table
  union/contact presence also stayed weak: validation `0.2857142984867096`
  and test `0.3333333432674408`. The selected next action is
  `detector0_union_target_data_or_schema_remediation`.
- M3AE-AH is queued to run one local no-spend data/schema remediation
  diagnostic before any crop-normalization ablation, recognizer training,
  packet mutation, or broad route. It must explain whether the M3AE-AG smoke
  failure is a packet data issue, tensor/frame alignment issue, target schema
  issue, smoke instrumentation issue, insufficient no-new-source support, or
  stop/reduced-claim condition.
- M3AE-AH closed the read-only diagnostic. The remediation receipt
  [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json)
  found zero packet target-derivation mismatches, zero tensor hash mismatches,
  and zero M3AE-AG smoke-row alignment mismatches. The current packet still has
  union/contact support train 7 / validation 7 / test 6. The train
  union/contact target geometry has a no-training median constant-box MAE of
  `0.04107142857142857`, below the `0.15` train-path cap, while the M3AE-AG
  smoke reported train box MAE `0.18746726214885712`. The diagnostic therefore
  classifies the failure as `smoke_implementation_instrumentation_issue`, not
  a packet/tensor/schema mismatch. The selected next action is
  `detector0_union_target_training_smoke_continue`.
- M3AE-AI is queued to repair the local union-target smoke instrumentation or
  training path and run exactly one bounded local no-spend smoke rerun. It must
  record row-level predictions, target-local constant baselines, and the
  repaired train/validation/test metrics before any crop-normalization ablation
  or recognizer training.
- M3AE-AI closed the instrumentation repair slice. The smoke-continue receipt
  [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json)
  records 32 row-level prediction/error rows, target-local mean and median
  constant-box baselines, local device `cpu`, and exactly one smoke rerun.
  Instrumentation is now complete, but the unchanged scratch training path
  still failed train-path box sanity: train box MAE stayed
  `0.18746726214885712` while the train median constant-box baseline was
  `0.04107142239809036`. Validation/test presence also remained weak
  (`0.1818181872367859` all-row validation, `0.30000001192092896` all-row
  test). The selected next action remains
  `detector0_union_target_training_smoke_continue`.
- M3AE-AJ closed the no-training median-box baseline diagnostic. The receipt
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json)
  records train-derived mean and median constant boxes, 32 per-row baseline
  rows, per-split MAE/IoU, observer-249 binding, local device `cpu`, and no
  training or gradient updates. The train median constant-box baseline stayed
  at `0.04107142239809036`, beating M3AE-AG and M3AE-AI train box MAE
  `0.18746726214885712` and also beating both on validation/test present-target
  MAE. The minimum future trainable Detector 0 bar is now explicit: beat this
  train median-box baseline on train before any crop-normalization ablation or
  recognizer training. The exact next action is
  `detector0_union_target_architecture_reformulation_design`.
- M3AE-AK closed the design-only architecture reformulation. The artifact
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md)
  rejects the failed MLP-over-downsampled-full-frame path, selects
  `anchor_residual_coordconv_union_target_microprobe_v1`, initializes future
  residual box prediction at the M3AE-AJ median box, and requires any future
  microprobe to beat train MAE `0.04107142239809036` and train IoU
  `0.6165503859519958` before any crop-normalization ablation or recognizer
  training. The exact next action is
  `detector0_union_target_architecture_microprobe`.
- M3AE-AL closed the selected bounded local architecture microprobe. The receipt
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json)
  records one CPU run of
  `anchor_residual_coordconv_union_target_microprobe_v1`, 32 row-level
  predictions, direct M3AE-AJ median-baseline comparison, no Brev spend, no
  packet mutation, and no export or product claim. The train gate passed:
  presence accuracy `1.0`, present-box MAE `0.02091207727789879` below
  `0.04107142239809036`, and present-box mean IoU `0.7846036553382874` above
  `0.6165503859519958`. Validation/test metrics remain report-only. The exact
  next action is `detector0_union_target_heldout_behavior_check_design`.
- M3AE-AM closed the design-only held-out behavior check plan. The artifact
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md)
  preserves M3AE-AL as train-fit success only, carries forward weak held-out
  evidence, defines row-level false-positive/false-negative and
  median-baseline comparison checks, and keeps ablation, recognizer work,
  export, promotion, product claims, Brev spend, packet mutation, source
  expansion, and broad redirects blocked. The exact next action is
  `detector0_union_target_heldout_behavior_check`.
- M3AE-AN closed one receipt-only held-out behavior check over the existing
  M3AE-AL JSON receipt, preserving the M3AE-AM design gates and writing
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json)
  (`7816f5fc69ffabceb63ffa0eb30e26202b36c6a156f464084e0b1c93e5890e87`)
  with fixed-threshold false-positive/false-negative accounting, row-level
  table-vs-non-table score behavior, validation/test median-baseline
  comparison, diagnostic threshold-sweep reporting without threshold selection,
  failure classification, and exactly one next action. Validation was `3` TP,
  `0` TN, `4` FP, `4` FN; test was `2` TP, `2` TN, `2` FP, `4` FN.
  Validation/test MAE and IoU lost to the M3AE-AJ median baseline, no threshold
  was selected or promoted, and the exact next action is
  `detector0_union_target_architecture_remediation`. No microprobe rerun,
  training, image/tensor payload loading, Brev compute, packet mutation,
  ablation, recognizer work, export, promotion, product claim, source
  expansion, or broad redirect occurred.
- M3AE-AO closed one design-only architecture remediation artifact at
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md),
  hash `57163e841f23abe00382c68d1a8f8b3f0c01d86497dce17bfa6f744d122eeaaf`,
  grounded in the M3AE-AN receipt, M3AE-AL microprobe, M3AE-AJ median
  baseline, M3AE-AK design, and observer-249 memo. It explains the train-fit
  versus held-out failure, rejects threshold/product-claim workarounds, defines
  future architecture/objective gates, and selects exactly one next action:
  `detector0_union_target_architecture_microprobe_v2`. No microprobe rerun,
  training, image/tensor payload loading, Brev compute, packet mutation,
  ablation, recognizer work, export, promotion, product claim, source
  expansion, or broad redirect occurred.
- M3AE-AP closed one local no-spend
  `spatial_objectness_anchor_residual_union_target_microprobe_v2` over the
  current approved Detector 0 packet and wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json),
  recording row-level train/validation/test predictions and direct M3AE-AJ
  median-baseline comparison. Train gates passed, held-out presence gates
  failed, no concrete data/schema invalidation was found, and the exact next
  action is `stop_reduced_claim`.
- M3AE-AP receipt is now recorded at
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
  (`a6de1a2e8537802927878e5a5810e9e83bbc19263b5d48d72c7b72a7d51ee039`).
  The v2 run fit train (`train_presence_accuracy=1.0`,
  `train_present_box_mae=0.0015357083175331354`,
  `train_present_box_mean_iou=0.9822187423706055`) but repeated held-out
  presence failure (`validation_presence_accuracy=0.3636363744735718`,
  `validation_false_negative_count=7`, `test_presence_accuracy=0.4000000059604645`,
  `test_false_negative_count=6`) with no data/schema invalidation. Exact next
  action: `stop_reduced_claim`.

M3AC selection notes:

- Source route: approved PopSign v1 original game raw videos only, source id
  `popsign-v1-original-videos`, source-register hash
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`.
- Coverage seed: existing PopSign 5-label diagnostic manifests under
  `data/manifests/diagnostics/popsign-label-ladder/005-labels/` with 25 train,
  25 validation, and 19 test clips per selected label.
- Limitation: `dad`, `grandpa`, and `hat` intentionally stress the head crop;
  if the small proof fails by head-region confusion, remediate the crop or
  label set before expanding.
- Hard boundary: this selection does not import media, start training, approve
  a new source, weaken final gates, export ONNX, or promote a model card.

M3AD decode/dataloader target:

- target manifests: `data/manifests/return-to-form-tier0/train.json`,
  `data/manifests/return-to-form-tier0/validation.json`, and
  `data/manifests/return-to-form-tier0/test.json`;
- target receipt:
  [`docs/validation/return-to-form-tier0-decode-dataloader.json`](../validation/return-to-form-tier0-decode-dataloader.json);
- required binding: source-register hash, fixed crop-config hash, selected
  labels, approved source id `popsign-v1-original-videos`, tensor counts,
  missing-file count, split limitations, and at least one dataloader batch shape
  per split;
- proof status: passed in session 185. The refreshed local manifests bind
  source-register hash
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`
  and crop-config hash
  `dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29`.
  The receipt records 345 tensors, zero missing tensor files, and dataloader
  batch shape `[4, 16, 5, 96, 96, 3]` for train, validation, and test;
- manifest hashes:
  `train=03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de`,
  `validation=23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808`,
  `test=b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed`;
M3AE learnability target:

- active prompt:
  [`docs/model/return-to-form-tier0-learnability-goal-loop-prompt.md`](return-to-form-tier0-learnability-goal-loop-prompt.md);
- report:
  [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../validation/return-to-form-tier0-learnability-smoke.json);
- result: failed. The bounded smoke selected epoch 7 and reported
  `train_top1=0.376`, `train_macro_recall=0.376`, `loss_drop=0.171`,
  `validation_top1=0.256`, `validation_macro_recall=0.256`,
  `test_top1=0.242`, and `test_macro_recall=0.242` against random chance
  `0.2`;
- gate comparison: `tier0_train_sanity` failed because train top-1 and macro
  recall were below `0.8`, loss drop was below `0.4`, and `dad` plus
  `grandpa` had zero train recall. `tier0_validation_signal` also failed.
  `tier0_hard_negative_far` and `no_zero_accepted_true_class` remain blocked
  because this smoke has no calibrated threshold or reviewed Tier 0 reject set;
- exact next action: M3AC/M3AD remediation. Inspect fixed-crop contact sheets,
  region selection, tensor payload compatibility, and model architecture before
  any label expansion.

M3AE-R remediation target:

- active prompt:
  [`docs/model/return-to-form-tier0-remediation-goal-loop-prompt.md`](return-to-form-tier0-remediation-goal-loop-prompt.md);
- diagnostic:
  [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../validation/return-to-form-tier0-remediation-diagnostic.json);
- diagnostic status: generated in session 188. It inspected `dad`,
  `grandpa`, `please`, `hat`, and `table` across train/validation/test,
  wrote contact sheets under
  [`docs/validation/return-to-form-tier0-remediation-contact-sheets/`](../validation/return-to-form-tier0-remediation-contact-sheets/),
  and classified the first concrete failure as
  `tensor_payload_preprocessing`;
- tensor finding: all 45 sampled M3AD payloads contained `rgb_regions`, but
  `RawFrameClipDataset` consumed only the `rgb_frames` compatibility tensor.
  The sampled `rgb_frames` tensors matched the `upper_body_signing_space`
  region slice, so the M3AE model did not consume the intended fixed-region
  stack;
- advisory API synthesis:
  [`docs/research/return-to-form-tier0-remediation-api-synthesis.md`](../research/return-to-form-tier0-remediation-api-synthesis.md);
- priority labels: `dad` and `grandpa` because both had zero train recall in
  the bounded M3AE smoke;
- comparison labels: `please`, `hat`, and `table`;
- exact next action: fix the training/evaluation tensor contract so the next
  Tier 0 smoke consumes the intended `rgb_regions` fixed-crop stack, or an
  explicitly region-aware derived input, before any additional training;
- hard boundary: do not train again in the diagnostic slice.

M3AE-F tensor-contract fix target:

- active prompt:
  [`docs/model/return-to-form-tier0-tensor-contract-goal-loop-prompt.md`](return-to-form-tier0-tensor-contract-goal-loop-prompt.md);
- source diagnostic:
  [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../validation/return-to-form-tier0-remediation-diagnostic.json);
- fix receipt:
  [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json);
- fix status: generated in session 190. The training/evaluation loader now
  consumes `rgb_regions` when present and derives the explicit
  `rgb_regions_grid_v1` input before `prepare_frames`;
- receipt result: passed. It sampled 45 train/validation/test payloads across
  `please`, `table`, `dad`, `grandpa`, and `hat`, consumed `rgb_regions` for
  all sampled payloads, recorded the region order
  `viewer_left_hand_context`, `viewer_right_hand_context`,
  `upper_body_signing_space`, `head_context`, `full_frame_reference`, recorded
  train/validation/test dataloader batch shape `[4, 16, 3, 96, 96]`, and
  recorded `fallback_to_rgb_frames_count=0`;
- exact next action: queue a bounded Tier 0 learnability smoke rerun using the
  corrected `rgb_regions_grid_v1` input path. Do not expand labels or run a
  broad route first;
- hard boundary: do not run the next training smoke in the contract-fix slice.

M3AE-G learnability rerun target:

- active prompt:
  [`docs/model/return-to-form-tier0-learnability-rerun-goal-loop-prompt.md`](return-to-form-tier0-learnability-rerun-goal-loop-prompt.md);
- source tensor-contract receipt:
  [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json);
- prior failed report:
  [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../validation/return-to-form-tier0-learnability-smoke.json);
- target rerun report:
  [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json);
- rerun status: generated in session 192. One bounded from-scratch Tier 0
  smoke ran against the same selected five labels and M3AD manifests, with
  `pretrained_components: []` and the corrected `rgb_regions_grid_v1` input
  path. The report binds the M3AE-F tensor-contract receipt
  (`consumed_tensor_keys=["rgb_regions"]`, `derived_inputs=["rgb_regions_grid_v1"]`,
  `fallback_to_rgb_frames_count=0`);
- rerun result: failed. Full-split metrics were `train_top1=0.312`,
  `train_macro_recall=0.312`, `loss_drop=0.156`, `validation_top1=0.224`,
  `validation_macro_recall=0.224`, `test_top1=0.200`, and
  `test_macro_recall=0.200`. `dad` and `grandpa` still had zero train recall;
  `dad`, `grandpa`, and `table` had zero validation recall;
- gate comparison: `tier0_train_sanity` and `tier0_validation_signal` failed.
  `tier0_hard_negative_far` and `no_zero_accepted_true_class` remain blocked by
  the intentionally separate missing calibration/rejection slice;
- exact next action: return to M3AC/M3AD remediation. Inspect fixed-crop
  contact sheets, region selection, tensor payload compatibility, and model
  architecture before any label expansion. Do not queue M3AF from this rerun.

M3AE-H failure-remediation triage target:

- active prompt:
  [`docs/model/return-to-form-tier0-failure-remediation-triage-goal-loop-prompt.md`](return-to-form-tier0-failure-remediation-triage-goal-loop-prompt.md);
- source rerun report:
  [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json);
- source diagnostic/contact sheets:
  [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../validation/return-to-form-tier0-remediation-diagnostic.json)
  and
  [`docs/validation/return-to-form-tier0-remediation-contact-sheets/`](../validation/return-to-form-tier0-remediation-contact-sheets/);
- target triage report:
  [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json);
- triage status: generated in session 194. No training was run. The report
  compared M3AE and M3AE-G failure patterns, manually inspected the retained
  contact sheets, checked fixed-crop regions, confirmed the M3AE-F tensor
  contract remains closed evidence, and inspected the `rgb_regions_grid_v1`
  adapter plus `compact_3d_cnn_spatiotemporal` smoke configuration;
- triage result: no concrete crop cut-off was found in the retained sampled
  sheets, and the tensor contract remains passed. The active blocker is now a
  model/input-adapter/training-budget fit bottleneck: `rgb_regions_grid_v1`
  tiles five 96px regions into a 192x288 grid that `prepare_frames` resizes to
  96x96, while the smoke uses a compact global-pooled 3D model, no augmentation,
  `max_train_batches=8`, and best-validation checkpoint selection;
- exact next action: `model_architecture_microprobe`. Run a bounded
  no-label-expansion microprobe on the same Tier 0 manifests and approved
  PopSign tensors to isolate the train-fit bottleneck before any label
  expansion, broad evaluation, export, or product claim.

M3AE-K label/split remediation target:

- active prompt:
  [`docs/model/return-to-form-tier0-label-split-remediation-goal-loop-prompt.md`](return-to-form-tier0-label-split-remediation-goal-loop-prompt.md);
- source triage report:
  [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json);
- baseline rerun report:
  [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json);
- M3AE-I microprobe report:
  [`docs/validation/return-to-form-tier0-model-architecture-microprobe.json`](../validation/return-to-form-tier0-model-architecture-microprobe.json);
- target smoke report:
  [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](../validation/return-to-form-tier0-microprobe-config-smoke.json);
- target remediation report:
  [`docs/validation/return-to-form-tier0-label-split-remediation.json`](../validation/return-to-form-tier0-label-split-remediation.json);
- API strategy memo:
  [`artifacts/research/observer-195-tier0-strategy-api-response.md`](../../artifacts/research/observer-195-tier0-strategy-api-response.md);
- M3AE-I microprobe status: generated in session 196. One local MPS random-init
  `region_identity_mlp_v1` probe loaded `rgb_regions` directly, kept the crop
  axis explicit, selected two train clips per Tier 0 label, and avoided
  `rgb_regions_grid_v1`, `rgb_frames`, pretrained features, label expansion,
  source approval, export, and product-readiness claims;
- M3AE-I microprobe result: train-fit passed on the tiny identity-preserving
  subset.
  The report records `sample_count=10`, `train_top1=1.0`,
  `train_macro_recall=1.0`, all five labels at `recall=1.0`,
  `initial_loss=1.6026442050933838`, `final_loss=0.0`, and
  `epochs_ran=5`, compared with M3AE-G `train_top1=0.312` and random chance
  `0.2`;
- smoke status: generated in session 198. One local MPS random-init
  `region_identity_mlp_v1_full_split_smoke` job used the M3AE-I
  crop-identity-preserving path against the full Tier 0 train/validation/test
  manifests, consumed `rgb_regions` directly, avoided `rgb_regions_grid_v1`,
  and did not expand labels, approve sources, export, promote, or claim
  product readiness;
- smoke result: train sanity passed but validation signal failed. The report
  records `train_top1=1.0`, `train_macro_recall=1.0`,
  `loss_drop_fraction_from_initial_to_best=0.9998795650976163`,
  `validation_top1=0.216`, `validation_macro_recall=0.21600000000000003`,
  `test_top1=0.2736842105263158`, and
  `test_macro_recall=0.27368421052631575`. Validation `grandpa` recall was
  zero, and the validation gate target remains `top1>=0.6` and
  `macro_recall>=0.5`;
- remediation scope: inspect the Tier 0 manifests, source record ids, signer
  identity hashes, source splits, tensor paths, crop config, and M3AE-J
  confusion evidence to classify the train-fit versus validation/test gap.
  Do not run another training job;
- remediation report:
  [`docs/validation/return-to-form-tier0-label-split-remediation.json`](../validation/return-to-form-tier0-label-split-remediation.json);
- remediation status: generated in session 200. No training job, second
  microprobe, second smoke, label expansion, source approval/import,
  controlled clip-heldout evaluation, export, promotion, final-readiness claim,
  Brev stop, duplicate worker, final-gate weakening, or push occurred;
- remediation result: classified the blocker as
  `source_signer_distribution_gap`. The M3AE-J train split is learnable
  (`train_top1=1.0`, `train_macro_recall=1.0`), but validation/test remain near
  random while clip ids, source record ids, signer identity hashes, and tensor
  paths have zero overlap across train and validation/test. The gap is therefore
  best explained by source/signer distribution under the current PopSign-only
  preserved splits, not by manifest leakage or an input-adapter regression;
- exact next action: `source_distribution_remediation`. Remediate the Tier 0
  source/signer distribution before any additional training, label expansion,
  source approval/import, broad checkpoint evaluation, export, promotion, or
  product-readiness claim.

M3AE-L detector/crop-normalization bootstrap result:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-crop-normalization-goal-loop-prompt.md`](return-to-form-tier0-detector0-crop-normalization-goal-loop-prompt.md);
- source remediation report:
  [`docs/validation/return-to-form-tier0-label-split-remediation.json`](../validation/return-to-form-tier0-label-split-remediation.json);
- advisory localization memo:
  [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md);
- target bootstrap report:
  [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json);
- rationale: the user explicitly redirected toward composable ML subproblems
  after M3AE-K. The API memo agrees that the next high-leverage move is
  scratch localization/crop normalization, while M3AE-J/K show fixed crops can
  memorize the train split but do not generalize under signer-disjoint PopSign
  validation/test;
- scope: define minimal Detector 0 targets, annotation/provenance rules,
  annotation packet path(s), no-pretrained validation gates, fixed-vs-detector
  crop-normalization ablation design, stop conditions, and exactly one next
  action. Full landmarks are useful later but not required for the bootstrap;
- hard boundary: do not train Detector 0, retrain the recognizer, expand
  labels, approve/import sources, use pretrained detectors/landmarks, export,
  promote, claim readiness, stop Brev, push, or launch a broad run in this
  bootstrap slice.
- bootstrap report:
  [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json);
- bootstrap result: Detector 0 is justified only as a scratch localization and
  crop-normalization lane. The target schema is box/center based for
  left-or-first hand, right-or-second hand, head-or-face, and upper-body or
  signing-space targets, with full landmarks deferred until box/center
  localization works. The first packet is planned at
  `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
  and must use manual or manual-verified labels only;
- exact next action: `detector0_annotation_packet`. Create or populate the
  manual/manual-verified localization annotation packet, bind it to the existing
  Tier 0 manifest/source/crop hashes, and validate provenance before any
  Detector 0 training, recognizer training, ablation, export, promotion, or
  product-readiness claim.

M3AE-M Detector 0 annotation packet result:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-annotation-packet-goal-loop-prompt.md`](return-to-form-tier0-detector0-annotation-packet-goal-loop-prompt.md);
- bootstrap report:
  [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json);
- target packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target review report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md);
- rationale: M3AE-L selected `detector0_annotation_packet` as the single next
  action. The next useful step is to create or populate the manual/manual-
  verified packet and prove provenance before spending a Detector 0 training
  slice;
- hard boundary: do not train Detector 0, retrain the recognizer, run a
  crop-normalization ablation, expand labels, approve/import sources, use
  pretrained detectors/landmarks, export, promote, claim readiness, stop Brev,
  push, or launch a broad run in this annotation-packet slice.
- annotation packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- review report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md);
- packet result: 15 provenance-bound contact-sheet seed rows exist, covering
  every selected label across train, validation, and test. All rows use
  `project_manual_box_label` provenance and remain
  `needs_manual_verification`, so they are not ready for Detector 0 training;
- exact next action: `detector0_annotation_review`. Verify or correct the seed
  boxes with manual overlay review before any Detector 0 training,
  crop-normalization ablation, recognizer training, export, promotion, or
  product-readiness claim.

M3AE-N Detector 0 annotation review target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-annotation-review-goal-loop-prompt.md`](return-to-form-tier0-detector0-annotation-review-goal-loop-prompt.md);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target review report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md);
- rationale: M3AE-M produced seed rows but explicitly kept all 15 rows at
  `needs_manual_verification`, so training remains blocked until row-level
  review/correction evidence exists;
- hard boundary: do not train Detector 0, retrain the recognizer, run a
  crop-normalization ablation, expand labels, approve/import sources, use
  pretrained detectors/landmarks, export, promote, claim readiness, stop Brev,
  push, or launch a broad run in this annotation-review slice.
- review report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md);
- review result: all 15 packet rows were checked against retained contact
  sheets and a local overlay rendered from the packet tensors'
  `full_frame_reference` frames. Six rows were `manual_verified`, eight rows
  were `manual_corrected`, and one held-out `hat` row was
  `rejected_for_insufficient_visual_evidence`. The packet remains
  `not_ready_for_detector0_training`;
- exact next action: `detector0_annotation_review_continue`. Replace or
  independently verify the rejected held-out `hat` row before any scratch
  Detector 0 training smoke, crop-normalization ablation, recognizer training,
  export, promotion, or readiness claim.

M3AE-O Detector 0 annotation follow-up target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-annotation-followup-goal-loop-prompt.md`](return-to-form-tier0-detector0-annotation-followup-goal-loop-prompt.md);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- M3AE-N review report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md);
- target follow-up report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md);
- result: M3AE-O replaced rejected row `det0-v0-test-hat-001502-f005` with
  approved PopSign held-out test row `det0-v0-test-hat-001503-f010`; the packet
  now has 15 manual-verified or manual-corrected rows and zero rejected rows;
- rationale: M3AE-N reviewed all rows but left Detector 0 training blocked by
  one rejected held-out `hat` frame; M3AE-O resolved that exact row without
  repeating the full review or starting training;
- hard boundary: do not train Detector 0, retrain the recognizer, run a
  crop-normalization ablation, expand labels, approve/import sources, use
  pretrained detectors/landmarks, export, promote, claim readiness, stop Brev,
  push, or launch a broad run in this annotation-follow-up slice.
- exact next action: `detector0_training_smoke`.

M3AE-P Detector 0 local training smoke target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-training-smoke-goal-loop-prompt.md`](return-to-form-tier0-detector0-training-smoke-goal-loop-prompt.md);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- M3AE-O follow-up report:
  [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md);
- target smoke report:
  [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json);
- result: M3AE-P produced one retained local CPU scratch Detector 0 smoke
  receipt against the 15-row packet and recorded train-path loss/metric proof
  without a model export, final-readiness claim, or Brev compute;
- rationale: M3AE-O selected `detector0_training_smoke`, but the executor
  prompt forbids Brev spend. The smoke therefore stayed local on CPU and used
  only the approved packet tensors and target boxes;
- hard boundary: no Brev sync/training/spend, recognizer training,
  crop-normalization ablation, label expansion, source approval/import,
  pretrained detectors/landmarks, export, promotion, readiness claim, Brev
  stop, duplicate worker, push, or broad run.
- exact next action: `crop_normalization_ablation_design`.

M3AE-Q crop-normalization ablation design target:

- active prompt:
  [`docs/model/return-to-form-tier0-crop-normalization-ablation-design-goal-loop-prompt.md`](return-to-form-tier0-crop-normalization-ablation-design-goal-loop-prompt.md);
- source smoke report:
  [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json);
- source bootstrap report:
  [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target design:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md);
- result: M3AE-Q wrote the design-only ablation plan, binding the fixed-crop
  baseline and detector-normalized candidate to existing approved Tier 0
  artifacts, explicit metrics, stop rules, and no-spend boundaries;
- rationale: M3AE-P selected `crop_normalization_ablation_design` after proving
  Detector 0 packet/loss/metric wiring, but validation/test localization is not
  detector-quality proof and the next ablation needs a bounded design before
  any recognizer retraining or crop-normalization run;
- hard boundary: no implementation-code change, crop-normalization ablation
  run, recognizer training, Detector 0 retraining, label expansion,
  source approval/import, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop/sync/training/spend, duplicate worker, push, or
  broad run.
- exact next action: `crop_normalization_ablation_smoke`.

M3AE-S crop-normalization ablation smoke target:

- active prompt:
  [`docs/model/return-to-form-tier0-crop-normalization-ablation-smoke-goal-loop-prompt.md`](return-to-form-tier0-crop-normalization-ablation-smoke-goal-loop-prompt.md);
- source design:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md);
- source smoke report:
  [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target receipt:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json);
- result: M3AE-S ran one local MPS no-spend ablation smoke. Detector 0 train
  sanity passed, transform shape/source integrity passed, and the
  detector-normalized recognizer arm train-fit passed, but the right/second-hand
  target fallback rate failed the per-target gate before any promotion-worthy
  crop-normalization comparison;
- rationale: M3AE-Q selected `crop_normalization_ablation_smoke` after defining
  the bounded local comparison and stop rules. The smoke ran and selected
  `detector0_data_or_target_remediation`; the next useful slice must classify
  the right/second-hand fallback failure before any ablation rerun or training;
- hard boundary: no Brev sync/training/spend, label expansion, controlled
  clip-heldout evaluation, source approval/import, pretrained detector/landmark
  use, export, promotion, readiness claim, Brev stop, duplicate worker,
  final-gate weakening, push, or broad run.
- exact next action: `detector0_data_or_target_remediation`.

M3AE-T Detector 0 data/target remediation triage target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-data-target-remediation-goal-loop-prompt.md`](return-to-form-tier0-detector0-data-target-remediation-goal-loop-prompt.md);
- source smoke receipt:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json);
- target failure: M3AE-S `fallback_rate_gate` failed only because
  `right_or_second_hand` fallback was `0.8110507246376811`, above the `0.60`
  per-target cap. Overall fallback was `0.20276268115942028`, and the other
  targets had zero fallback in the gate summary;
- result: M3AE-T classified the failure as an optional second-hand target
  policy mismatch. The packet marks `right_or_second_hand` present in only
  three of fifteen verified rows, all for `table`; that verified optional-target
  absent rate is already above the M3AE-Q per-target fallback cap, while M3AE-S
  transform integrity passed and all fallbacks were below-threshold
  right/second-hand decisions;
- remediation scope: inspect packet target support, optional-target semantics,
  presence threshold behavior, transform fallback accounting, and retained
  M3AE-S evidence. Classify whether this is a packet-support, target-policy,
  threshold/fallback-policy, transform, or no-bounded-path issue;
- hard boundary: no ablation rerun, detector training, recognizer training,
  packet mutation, label expansion, controlled clip-heldout evaluation, source
  approval/import, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop/sync/training/spend, duplicate worker,
  final-gate weakening, push, or broad run.
- exact next action: `crop_normalization_optional_target_policy_revision`.

M3AE-U crop-normalization optional-target policy target:

- active prompt:
  [`docs/model/return-to-form-tier0-crop-normalization-optional-target-policy-goal-loop-prompt.md`](return-to-form-tier0-crop-normalization-optional-target-policy-goal-loop-prompt.md);
- source remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json);
- source smoke receipt:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json);
- target policy artifact:
  [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md);
- target issue: verified absent `right_or_second_hand` rows should not be
  counted as transform failure, but missed present right/second-hand targets
  must remain separately reportable, especially because current positive
  support is sparse and table-only;
- result: the policy artifact preserves M3AE-T as the failure-classification
  source of truth, treats verified absent optional `right_or_second_hand`
  fallback as report-only diagnostic accounting, keeps required-target fallback
  gates and missed-present optional fallback gate-affecting, and leaves final
  promotion blockers unchanged;
- hard boundary: no ablation rerun, detector training, recognizer training,
  implementation-code edit, packet mutation, label expansion, controlled
  clip-heldout evaluation, source approval/import, pretrained detector/landmark
  use, export, promotion, readiness claim, Brev stop/sync/training/spend,
  duplicate worker, final-gate weakening, push, or broad run.
- exact next action: `crop_normalization_policy_aware_ablation_smoke`.

M3AE-V policy-aware crop-normalization ablation smoke target:

- active prompt:
  [`docs/model/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-goal-loop-prompt.md`](return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-goal-loop-prompt.md);
- source policy artifact:
  [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md);
- source ablation smoke receipt:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json);
- source remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target receipt:
  [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json);
- target issue: rerun the bounded local ablation with M3AE-U accounting so
  verified absent optional `right_or_second_hand` rows are diagnostic-only,
  while missed-present `table` right/second-hand fallback remains
  gate-affecting and visible;
- required comparison: preserve M3AE-S raw fallback rates beside policy-aware
  rates and report fixed-crop versus detector-normalized recognizer metrics
  without converting this into a broad training run;
- result: the policy-aware receipt preserves M3AE-S raw fallback counts,
  records `3549` verified-absent optional `right_or_second_hand` fallback
  decisions as diagnostic-only, records `928` missed-present `table`
  right/second-hand fallback decisions as gate-affecting, keeps required-target
  fallback counts at zero, and preserves the retained fixed-crop versus
  detector-normalized recognizer metrics without a new Detector 0 or recognizer
  training run;
- hard boundary: no packet mutation, label expansion, controlled clip-heldout
  evaluation, source approval/import, pretrained detector/landmark use, export,
  promotion, readiness claim, Brev stop/sync/training/spend, duplicate worker,
  final-gate weakening, push, product-runtime code change, or broad run.
- exact next action: `detector0_optional_target_support_remediation`.

M3AE-W Detector 0 optional-target support remediation triage target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-optional-target-support-remediation-goal-loop-prompt.md`](return-to-form-tier0-detector0-optional-target-support-remediation-goal-loop-prompt.md);
- source policy-aware receipt:
  [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json);
- source policy artifact:
  [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md);
- source ablation smoke receipt:
  [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json);
- target issue: M3AE-V still fails the unchanged per-target cap because
  expected-present `table` right/second-hand misses are `928/1104`
  (`0.8405797101449275`) while packet support has only three table-positive
  rows;
- remediation scope: classify packet-support, target/schema/threshold,
  retained Detector 0 localization, transform/accounting, or no-bounded-path
  before any packet mutation, retraining, ablation rerun, source expansion, or
  product claim;
- hard boundary: no packet mutation, Detector 0 retraining, recognizer
  training, ablation rerun, label expansion, controlled clip-heldout
  evaluation, source approval/import, pretrained detector/landmark use, export,
  promotion, readiness claim, Brev stop/sync/training/spend, duplicate worker,
  final-gate weakening, push, product-runtime code change, or broad run.
- result: M3AE-W classified the blocker as packet-positive support scarcity.
  Existing table second-hand rows are reviewed and source-bound, but only three
  positives exist for 69 table manifest clips / 1104 frame decisions. No
  concrete table-box inconsistency, optional-target policy defect, transform
  accounting bug, source approval issue, or no-bounded-path condition was found.
- exact next action: `detector0_table_second_hand_packet_expansion_design`.

M3AE-X Detector 0 table second-hand packet expansion design target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-goal-loop-prompt.md`](return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-goal-loop-prompt.md);
- source remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json);
- source policy-aware receipt:
  [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json);
- packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target design artifact:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md);
- target issue: M3AE-W found a bounded no-new-source path is to design an
  expansion of reviewed `table` right/second-hand support from approved Tier 0
  PopSign rows before any packet mutation or retraining;
- required design: candidate-selection criteria, split-balance targets,
  manual/manual-corrected review rules, non-mutation boundaries, and retained
  M3AE-V miss-rate baseline;
- hard boundary: no packet mutation, approved box annotation, Detector 0
  retraining, recognizer training, ablation rerun, label expansion, controlled
  clip-heldout evaluation, source approval/import, pretrained detector/landmark
  use, export, promotion, readiness claim, Brev stop/sync/training/spend,
  duplicate worker, final-gate weakening, push, product-runtime code change, or
  broad run.
- result: M3AE-X selected a bounded candidate-packet review path. The design
  targets up to six new `table` right/second-hand candidates per split from
  existing approved Tier 0 manifests, with at least five total reviewed
  positives per split required before any training or ablation rerun.
- exact next action:
  `detector0_table_second_hand_candidate_packet_review`.

M3AE-Y Detector 0 table second-hand candidate packet review target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-goal-loop-prompt.md`](return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-goal-loop-prompt.md);
- source design artifact:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md);
- target review artifact:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md);
- target issue: M3AE-X selected a bounded candidate-packet review path from
  existing approved Tier 0 PopSign `table` manifests before any approved packet
  mutation or retraining;
- required review: up to six new candidates per split, candidate-scoped
  statuses, provenance, candidate boxes, accepted/rejected counts by split,
  packet unchanged proof, M3AE-V baseline, M3AE-X target status, and exactly
  one next action;
- hard boundary: no approved packet mutation, approved box annotation, Detector
  0 retraining, recognizer training, ablation rerun, label expansion,
  controlled clip-heldout evaluation, source approval/import, pretrained
  detector/landmark use, export, promotion, readiness claim, Brev
  stop/sync/training/spend, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.
- result: M3AE-Y reviewed 17 new `table` right/second-hand candidate rows from
  existing approved Tier 0 manifests, accepted all 17 as candidate-scoped
  `candidate_manual_corrected` rows, and preserved the approved Detector 0
  packet unchanged.
- exact next action:
  `detector0_table_second_hand_packet_mutation`.

M3AE-Z Detector 0 table second-hand packet mutation target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-table-second-hand-packet-mutation-goal-loop-prompt.md`](return-to-form-tier0-detector0-table-second-hand-packet-mutation-goal-loop-prompt.md);
- source candidate-review artifact:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md);
- target mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json);
- target issue: M3AE-Y found enough accepted candidate rows to meet the
  minimum per-split `table` right/second-hand support target; the next bounded
  step is to add those rows to the approved Detector 0 packet before any
  detector retraining or ablation rerun;
- required mutation: accepted M3AE-Y candidates only, stable packet row ids,
  complete provenance, full target schema fields, updated summary counts,
  pre/post packet hashes, mutation receipt, and exactly one next action;
- result: M3AE-Z added 17 accepted M3AE-Y `table` right/second-hand candidate
  rows to the approved Detector 0 packet, raising packet rows from 15 to 32 and
  table right/second-hand support to train 7, validation 7, and test 6;
- schema assessment: the mutation receipt separates candidate sufficiency from
  target-schema risk; independent left/right boxes are usable only for the next
  tiny scratch Detector 0 smoke, and a two-hand union/contact-region schema
  slice remains preferred if the smoke does not improve second-hand
  localization cleanly;
- packet hash before mutation:
  `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34`;
- packet hash after mutation:
  `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`;
- exact next action:
  `detector0_expanded_packet_training_smoke`;
- hard boundary: no Detector 0 retraining, recognizer training, ablation rerun,
  label expansion, controlled clip-heldout evaluation, source approval/import,
  pretrained detector/landmark use, export, promotion, readiness claim, Brev
  stop/sync/training/spend, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.

M3AE-AA Detector 0 expanded packet training smoke target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-expanded-packet-training-smoke-goal-loop-prompt.md`](return-to-form-tier0-detector0-expanded-packet-training-smoke-goal-loop-prompt.md);
- source mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json);
- expanded packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- target issue: M3AE-Z added enough approved `table` right/second-hand rows to
  support a tiny local scratch Detector 0 smoke, but the receipt still treats
  independent left/right boxes as smoke-usable only because overlapping `table`
  hands may require a two-hand union/contact-region target;
- required smoke: approved expanded packet rows only, packet hash
  `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`,
  local CPU/MPS only, random scratch Detector 0, train/validation/test metrics,
  `table` `right_or_second_hand` metrics, M3AE-Z schema-risk interpretation,
  Brev no-spend proof, final-promotion blocker separation, and exactly one
  next action;
- target receipt:
  [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json);
- result: M3AE-AA ran the local CPU scratch smoke on the expanded 32-row packet;
  train-path sanity passed, but held-out `table` right/second-hand independent
  boxes stayed weak or ambiguous, so the receipt selected schema revision
  instead of ablation rerun;
- receipt hash:
  `baa2d2f958f50e299fb8d59e2ea2a0d081dd8995181da1719d60ead0c4971def`;
- exact next action:
  `detector0_two_hand_union_schema_revision`;
- exact next action choices: `crop_normalization_expanded_packet_ablation_smoke`,
  `detector0_two_hand_union_schema_revision`,
  `detector0_expanded_packet_training_smoke_continue`,
  `detector0_data_or_target_remediation`, or `stop_reduced_claim`;
- hard boundary: no crop-normalization ablation rerun, recognizer training,
  label expansion, controlled clip-heldout evaluation, source approval/import,
  pretrained detector/landmark use, export, promotion, readiness claim, Brev
  stop/sync/training/spend, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.

M3AE-AB Detector 0 two-hand union schema revision target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-two-hand-union-schema-goal-loop-prompt.md`](return-to-form-tier0-detector0-two-hand-union-schema-goal-loop-prompt.md);
- source expanded-packet smoke receipt:
  [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json);
- target issue: M3AE-AA passed local train-path sanity but failed held-out
  `table` right/second-hand behavior, so independent left/right boxes are not
  honest enough to feed another crop-normalization ablation rerun;
- required schema artifact:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md);
- required design: target semantics for
  `table_two_hand_union_or_contact_region`, derivation rules from reviewed
  left/right boxes, review/provenance requirements, later packet-mutation scope,
  local validation gates, Brev no-spend proof, final-promotion blocker
  separation, and exactly one next action;
- result: M3AE-AB defined `table_two_hand_union_or_contact_region` as a
  derived two-hand union/contact remediation target for `table` frames, using
  reviewed left/right boxes as evidence only and preserving packet mutation as
  a later bounded no-training slice;
- schema artifact hash:
  `4e0972b77304c09ffa3e4f5fee4c3b9f71c26f6efe2fe14a13eed82773892716`;
- exact next action:
  `detector0_two_hand_union_packet_mutation`;
- exact next action choices: `detector0_two_hand_union_packet_mutation`,
  `detector0_two_hand_union_schema_continue`,
  `detector0_data_or_target_remediation`, or `stop_reduced_claim`;
- hard boundary: no packet mutation, Detector 0 training, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled
  clip-heldout evaluation, source approval/import, pretrained detector/landmark
  use, export, promotion, readiness claim, Brev stop/sync/training/spend,
  duplicate worker, final-gate weakening, push, product-runtime code change, or
  broad run.

M3AE-AC Detector 0 two-hand union packet mutation target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-two-hand-union-packet-mutation-goal-loop-prompt.md`](return-to-form-tier0-detector0-two-hand-union-packet-mutation-goal-loop-prompt.md);
- source schema artifact:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md);
- source expanded packet:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json),
  expected pre-hash
  `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`;
- target mutation: add `table_two_hand_union_or_contact_region` target schema
  and target objects to existing approved packet rows only;
- required mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json);
- required proof: pre/post packet hashes, schema artifact hash, derived row
  ids/counts, unresolved row counts/reasons, no-pretrained/source/Brev
  boundaries, final-promotion blocker separation, and exactly one next action;
- exact next action choices: `detector0_two_hand_union_training_smoke`,
  `detector0_two_hand_union_packet_mutation_continue`,
  `detector0_data_or_target_remediation`, or `stop_reduced_claim`;
- hard boundary: no row additions, Detector 0 training, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled
  clip-heldout evaluation, source approval/import, generated pseudo-labels,
  pretrained detector/landmark use, export, promotion, readiness claim, Brev
  stop/sync/training/spend, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.

M3AE-AD Detector 0 union target remediation target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-remediation-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-remediation-goal-loop-prompt.md);
- source mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json);
- unresolved row:
  `det0-v0-train-table-000376-f010`, whose M3AE-AB 0.02-margin union width is
  `0.88` against the `0.85` cap;
- required remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json);
- required proof: source/schema/packet/mutation hashes, unresolved-row
  analysis, classification, any packet correction proof, no-pretrained/source/
  Brev boundaries, final-promotion blocker separation, and exactly one next
  action;
- exact next action choices: `detector0_two_hand_union_training_smoke`,
  `detector0_two_hand_union_packet_mutation_continue`,
  `detector0_two_hand_union_schema_revision`,
  `detector0_union_target_packet_support_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no row additions, Detector 0 training, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled
  clip-heldout evaluation, source approval/import, generated pseudo-labels,
  schema weakening, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop/sync/training/spend, duplicate worker,
  final-gate weakening, push, product-runtime code change, or broad run.

M3AE-AE Detector 0 two-hand union margin schema revision target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-goal-loop-prompt.md`](return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-goal-loop-prompt.md);
- source remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json);
- source schema artifact:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md);
- schema issue:
  raw union width `0.84` is valid under the M3AE-AB `0.85` cap, but the fixed
  `0.02` context margin expands the row to `0.88`;
- required schema revision artifact:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md);
- required proof: selected margin/threshold semantics, M3AE-AD edge-case
  handling, no-pretrained/source/Brev boundaries, final-promotion blocker
  separation, and exactly one next action;
- exact next action choices: `detector0_two_hand_union_packet_mutation_continue`,
  `detector0_two_hand_union_schema_revision_continue`,
  `detector0_union_target_packet_support_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no packet mutation, row additions, Detector 0 training,
  crop-normalization ablation rerun, recognizer training, label expansion,
  controlled clip-heldout evaluation, source approval/import, generated
  pseudo-labels, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop/sync/training/spend, duplicate worker,
  final-gate weakening, push, product-runtime code change, or broad run.

M3AE-AF Detector 0 two-hand union packet mutation continuation target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-two-hand-union-packet-mutation-continue-goal-loop-prompt.md`](return-to-form-tier0-detector0-two-hand-union-packet-mutation-continue-goal-loop-prompt.md);
- source schema revision:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md);
- packet target:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- required mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json);
- required proof: pre/post packet hashes, schema revision hash, changed target
  ids, effective context margins for reduced-margin rows, unresolved row
  counts, split support, no-pretrained/source/Brev boundaries,
  final-promotion blocker separation, and exactly one next action;
- exact next action choices: `detector0_two_hand_union_training_smoke`,
  `detector0_two_hand_union_packet_mutation_continue`,
  `detector0_union_target_packet_support_remediation`,
  `detector0_two_hand_union_schema_revision_continue`, or
  `stop_reduced_claim`;
- hard boundary: no row additions, Detector 0 training, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled
  clip-heldout evaluation, source approval/import, generated pseudo-labels,
  schema weakening, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop/sync/training/spend, duplicate worker,
  final-gate weakening, push, product-runtime code change, or broad run.

M3AE-AG Detector 0 two-hand union training smoke target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-two-hand-union-training-smoke-goal-loop-prompt.md`](return-to-form-tier0-detector0-two-hand-union-training-smoke-goal-loop-prompt.md);
- source mutation receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json);
- packet target:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- required smoke receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json);
- required proof: command, local device, packet hash, split counts, model
  summary, loss/metric summaries, table union/contact metrics,
  no-pretrained/source/Brev boundaries, final-promotion blocker separation, and
  exactly one next action;
- exact next action choices: `crop_normalization_union_target_ablation_design`,
  `detector0_two_hand_union_training_smoke_continue`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no packet mutation, row additions, Brev sync/training/spend,
  crop-normalization ablation rerun, recognizer training, label expansion,
  controlled clip-heldout evaluation, source approval/import, generated
  pseudo-labels, pretrained detector/landmark use, export, promotion, readiness
  claim, Brev stop, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.
- result: M3AE-AG wrote
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json)
  from a local CPU scratch smoke over packet hash
  `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`.
  The train-path sanity check failed on box MAE (`0.18746726214885712` >
  `0.15`) despite train presence accuracy `1.0` and loss-drop fraction
  `0.805999828613751`. Held-out table union/contact presence accuracy was
  validation `0.2857142984867096` and test `0.3333333432674408`; validation
  mean IoU was `0.0` and test mean IoU was `0.0747925192117691`.
- exact next action:
  `detector0_union_target_data_or_schema_remediation`.

M3AE-AH Detector 0 union-target data/schema remediation target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-data-schema-remediation-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-data-schema-remediation-goal-loop-prompt.md);
- failure source receipt:
  [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json);
- packet target:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- required remediation receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json);
- required proof: packet/smoke/schema/source hashes, frame/tensor/target
  alignment checks, geometry summary, classification, no-pretrained/source/
  Brev boundaries, final-promotion blocker separation, and exactly one next
  action;
- exact next action choices: `detector0_two_hand_union_schema_revision`,
  `detector0_two_hand_union_packet_mutation_continue`,
  `detector0_union_target_training_smoke_continue`,
  `crop_normalization_union_target_ablation_design`, or
  `stop_reduced_claim`;
- hard boundary: no Detector 0 training or training-smoke rerun, packet
  mutation, row additions, Brev sync/training/spend, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled clip-heldout
  evaluation, source approval/import, generated pseudo-labels, pretrained
  detector/landmark use, export, promotion, readiness claim, Brev stop,
  duplicate worker, final-gate weakening, push, product-runtime code change, or
  broad run.
- result: M3AE-AH wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json)
  and classified the M3AE-AG failure as
  `smoke_implementation_instrumentation_issue`. Packet/tensor/smoke alignment
  checks all had mismatch count `0`; the bounded-adaptive union derivation
  matched all 20 table rows; and a train-split median constant-box baseline
  had MAE `0.04107142857142857` versus the smoke's train box MAE
  `0.18746726214885712`.
- exact next action:
  `detector0_union_target_training_smoke_continue`.

M3AE-AI Detector 0 union-target training smoke continue target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-training-smoke-continue-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-training-smoke-continue-goal-loop-prompt.md);
- failure-classification receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json);
- packet target:
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json);
- required smoke-continue receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json);
- required proof: local device, exactly one smoke rerun, packet/remediation/
  smoke/schema/source hashes, model summary, train/validation/test metrics,
  row-level predictions, target-local constant baselines, no-pretrained/source/
  Brev boundaries, final-promotion blocker separation, and exactly one next
  action;
- exact next action choices: `crop_normalization_union_target_ablation_design`,
  `detector0_union_target_training_smoke_continue`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no packet mutation, row additions, Brev sync/training/spend,
  crop-normalization ablation rerun, recognizer training, label expansion,
  controlled clip-heldout evaluation, source approval/import, generated
  pseudo-labels, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.
- result: M3AE-AI wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json)
  with row-level predictions and target-local baselines. The receipt
  classified the run as `instrumentation_complete_training_path_still_unrepaired`:
  train presence accuracy reached `1.0`, but train box MAE remained
  `0.18746726214885712` against the `0.15` cap and the train median
  constant-box baseline `0.04107142239809036`.
- exact next action:
  `detector0_union_target_training_smoke_continue`.

M3AE-AJ Detector 0 union-target median-box baseline diagnostic target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-goal-loop-prompt.md);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- current failure receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json);
- required baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- required proof: local device, no training or gradient update, packet/
  remediation/smoke/schema/source hashes, train-derived mean and median
  constant boxes, per-row/per-split MAE and IoU, direct comparison to M3AE-AG
  and M3AE-AI, no-pretrained/source/Brev boundaries, final-promotion blocker
  separation, and exactly one next action;
- exact next action choices:
  `detector0_union_target_architecture_reformulation_design`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no Detector 0 training or training-smoke retry, packet
  mutation, row additions, Brev sync/training/spend, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled clip-heldout
  evaluation, source approval/import, generated pseudo-labels, pretrained
  detector/landmark use, export, promotion, readiness claim, Brev stop,
  duplicate worker, final-gate weakening, push, product-runtime code change, or
  broad run.
- result: M3AE-AJ wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json)
  and classified the result as
  `median_box_baseline_reproduced_training_path_reformulation_required`. The
  train-derived median constant-box MAE is `0.04107142239809036`, versus
  `0.18746726214885712` for both M3AE-AG and M3AE-AI train boxes.
- exact next action:
  `detector0_union_target_architecture_reformulation_design`.

M3AE-AK Detector 0 union-target architecture reformulation design target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-architecture-reformulation-design-goal-loop-prompt.md);
- current baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- required design artifact:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md);
- required proof: design constraints, rejected formulations, selected trainable
  formulation, future command sketch, target encoding, loss, initialization,
  exact success and stop gates, no-pretrained/source/Brev boundaries,
  final-promotion blocker separation, and exactly one next action;
- exact next action choices: `detector0_union_target_architecture_microprobe`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no Detector 0 training or training-smoke retry, packet
  mutation, row additions, Brev sync/training/spend, crop-normalization
  ablation rerun, recognizer training, label expansion, controlled clip-heldout
  evaluation, source approval/import, generated pseudo-labels, pretrained
  detector/landmark use, export, promotion, readiness claim, Brev stop,
  duplicate worker, final-gate weakening, push, product-runtime code change, or
  broad run.
- result: M3AE-AK wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md)
  and selected `anchor_residual_coordconv_union_target_microprobe_v1` as the
  only future trainable formulation. The future microprobe must beat the
  M3AE-AJ train median-box MAE `0.04107142239809036` before any ablation,
  recognizer training, export, promotion, or product claim.
- exact next action:
  `detector0_union_target_architecture_microprobe`.

M3AE-AL Detector 0 union-target architecture microprobe target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-architecture-microprobe-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-architecture-microprobe-goal-loop-prompt.md);
- architecture design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md);
- current baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- required microprobe receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json);
- selected formulation:
  `anchor_residual_coordconv_union_target_microprobe_v1`;
- required proof: local no-spend scratch microprobe, `rgb_regions`
  `full_frame_reference` input, M3AE-AJ median-box anchor, bounded residual
  output, train/validation/test row-level predictions, per-split metrics,
  direct M3AE-AJ comparison, no-pretrained/source/Brev boundaries,
  final-promotion blocker separation, and exactly one next action;
- pass gate: train presence accuracy `1.0`, train present-box MAE below
  `0.04107142239809036`, train present-box mean IoU above
  `0.6165503859519958`, row-level predictions present, and median-baseline
  comparison present;
- exact next action choices:
  `detector0_union_target_heldout_behavior_check_design`,
  `detector0_union_target_architecture_remediation`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no generic Detector 0 training-smoke retry, packet mutation,
  row additions, Brev sync/training/spend, crop-normalization ablation rerun,
  recognizer training, label expansion, controlled clip-heldout evaluation,
  source approval/import, generated pseudo-labels, pretrained
  detector/landmark use, export, promotion, readiness claim, Brev stop,
  duplicate worker, final-gate weakening, push, product-runtime code change, or
  broad run.
- result: M3AE-AL wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json)
  using local CPU, current approved packet tensors, `rgb_regions`
  `full_frame_reference`, and the M3AE-AJ train median box as the anchor. The
  train pass gate succeeded with presence accuracy `1.0`, present-box MAE
  `0.02091207727789879`, and present-box mean IoU `0.7846036553382874`. The
  receipt records 32 row-level predictions, direct median-baseline comparison,
  no Brev spend, no packet mutation, no export, no promotion, and no final
  readiness claim.
- exact next action:
  `detector0_union_target_heldout_behavior_check_design`.

M3AE-AM Detector 0 union-target held-out behavior check design target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-goal-loop-prompt.md);
- architecture microprobe receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json);
- architecture design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md);
- current baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- required design artifact:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md);
- required proof: design-only held-out behavior check plan, row-level questions
  bound to M3AE-AL predictions, split metrics, median-baseline comparisons,
  false-positive/false-negative accounting, pass/fail gates, stop rules,
  no-training/no-pretrained/source/Brev boundaries, final-promotion blocker
  separation, and exactly one next action;
- exact next action choices:
  `detector0_union_target_heldout_behavior_check`,
  `detector0_union_target_architecture_remediation`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no microprobe rerun, generic Detector 0 training-smoke retry,
  packet mutation, row additions, Brev sync/training/spend,
  crop-normalization ablation rerun, recognizer training, label expansion,
  controlled clip-heldout evaluation, source approval/import, generated
  pseudo-labels, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop, duplicate worker, final-gate weakening, push,
  product-runtime code change, or broad run.
- result: M3AE-AM wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md)
  as a design-only artifact. It binds the future check to existing M3AE-AL
  row-level predictions, carries forward weak validation/test behavior, requires
  fixed-threshold false-positive/false-negative accounting and validation/test
  median-baseline comparisons, and keeps crop-normalization ablation blocked
  until held-out behavior passes.
- exact next action:
  `detector0_union_target_heldout_behavior_check`.

M3AE-AN Detector 0 union-target held-out behavior check target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-heldout-behavior-check-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-heldout-behavior-check-goal-loop-prompt.md);
- design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md);
- architecture microprobe receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json);
- current baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- architecture design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- required receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json);
- required proof: no-training held-out behavior check over existing M3AE-AL
  receipt data only, fixed-threshold validation/test false-positive/
  false-negative accounting, row-level table-vs-non-table score behavior,
  validation/test median-baseline comparisons, diagnostic threshold sweep
  without threshold selection, failure classification, no-pretrained/source/
  Brev boundaries, final-promotion blocker separation, and exactly one next
  action;
- exact next action choices: `crop_normalization_ablation_design`,
  `detector0_union_target_architecture_remediation`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- pass gate for `crop_normalization_ablation_design`: validation/test presence
  accuracy at least `0.80`, false positives and false negatives no more than
  `1` per held-out split, validation/test box MAE no worse than the M3AE-AJ
  median baseline, validation/test IoU no worse than the M3AE-AJ median
  baseline, row-level error table recorded, threshold sweep reported without
  selecting a product threshold, and no-training/export boundaries preserved;
- expected failure routing: if the current M3AE-AL pattern remains, especially
  missed `table` rows with high-scoring non-table false positives and
  validation/test MAE/IoU worse than the median baseline, select
  `detector0_union_target_architecture_remediation`;
- hard boundary: no microprobe rerun, Detector 0 training or training-smoke
  retry, image/tensor payload load, packet mutation, row additions, Brev
  sync/training/spend, crop-normalization ablation rerun, recognizer training,
  label expansion, controlled clip-heldout evaluation, source approval/import,
  generated pseudo-labels, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop, duplicate worker, final-gate weakening, threshold
  promotion, push, product-runtime code change, or broad run.
- result: M3AE-AN wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json)
  (`7816f5fc69ffabceb63ffa0eb30e26202b36c6a156f464084e0b1c93e5890e87`)
  from existing M3AE-AL receipt rows and metrics only. At the fixed `0.5`
  threshold, validation recorded `3` TP, `0` TN, `4` FP, and `4` FN; test
  recorded `2` TP, `2` TN, `2` FP, and `4` FN. Validation/test present-box MAE
  and IoU were worse than the M3AE-AJ median baseline, non-table false
  positives outscored table false negatives, and the threshold sweep remained
  report-only with no selected product threshold.
- exact next action:
  `detector0_union_target_architecture_remediation`.

M3AE-AO Detector 0 union-target architecture remediation target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-architecture-remediation-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-architecture-remediation-goal-loop-prompt.md);
- held-out behavior check receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json);
- held-out design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md);
- architecture microprobe receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json);
- architecture design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md);
- current baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- required design artifact:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md);
- required proof: design-only architecture/objective remediation grounded in
  the M3AE-AN held-out failure, train-fit versus held-out split, rejected
  threshold/product-claim workarounds, future architecture gates,
  no-pretrained/source/Brev boundaries, final-promotion blocker separation, and
  exactly one next action;
- exact next action choices:
  `detector0_union_target_architecture_microprobe_v2`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no microprobe rerun, Detector 0 training or training-smoke
  retry, image/tensor payload load, packet mutation, row additions, Brev
  sync/training/spend, crop-normalization ablation rerun, recognizer training,
  label expansion, controlled clip-heldout evaluation, source approval/import,
  generated pseudo-labels, pretrained detector/landmark use, export, promotion,
  readiness claim, Brev stop, duplicate worker, final-gate weakening, threshold
  promotion, push, product-runtime code change, or broad run.
- result: M3AE-AO wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md)
  (`57163e841f23abe00382c68d1a8f8b3f0c01d86497dce17bfa6f744d122eeaaf`)
  as a design-only artifact. It preserves the M3AE-AN held-out failure
  classification, rejects threshold/product-claim workarounds and immediate
  ablation/recognizer/export paths, and selects a bounded local scratch spatial
  objectness plus anchor-residual future microprobe.
- exact next action:
  `detector0_union_target_architecture_microprobe_v2`.

M3AE-AP Detector 0 union-target architecture microprobe v2 target:

- active prompt:
  [`docs/model/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2-goal-loop-prompt.md`](return-to-form-tier0-detector0-union-target-architecture-microprobe-v2-goal-loop-prompt.md);
- remediation design source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md);
- held-out behavior check receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json);
- architecture microprobe v1 receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json);
- current baseline receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json);
- escalation memo:
  [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md);
- required receipt:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json);
- required proof: exactly one local no-spend scratch
  `spatial_objectness_anchor_residual_union_target_microprobe_v2` run over the
  current approved packet, with row-level train/validation/test predictions,
  fixed-threshold false-positive/false-negative behavior, M3AE-AJ
  median-baseline comparison, strict train and held-out gates,
  no-pretrained/source/Brev boundaries, final-promotion blocker separation, and
  exactly one next action;
- exact next action choices:
  `crop_normalization_ablation_design`,
  `detector0_union_target_data_or_schema_remediation`, or
  `stop_reduced_claim`;
- hard boundary: no generic Detector 0 training-smoke retry, packet mutation,
  row additions, Brev sync/training/spend, crop-normalization ablation rerun,
  recognizer training, label expansion, controlled clip-heldout evaluation,
  source approval/import, generated pseudo-labels, pretrained
  detector/landmark use, export, promotion, readiness claim, Brev stop,
  duplicate worker, final-gate weakening, product threshold promotion, push,
  product-runtime code change, or broad run.
- result: M3AE-AP ran exactly one local CPU no-spend
  `spatial_objectness_anchor_residual_union_target_microprobe_v2` and wrote
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
  (`a6de1a2e8537802927878e5a5810e9e83bbc19263b5d48d72c7b72a7d51ee039`).
  Runner:
  [`scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py`](../../scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py)
  (`cc79e1cb1aae3ae7b93fb3328f3849a6a018ad5c0d04a54552c20f6452d79004`).
  The receipt classification is `train_fit_but_heldout_failure_repeated`.
  Train gates passed against the M3AE-AJ median baseline, but validation/test
  presence gates failed at fixed threshold `0.5`, validation box metrics still
  lost to the M3AE-AJ median baseline, no packet/tensor/source/schema
  invalidation was found, no product threshold was selected, and no Brev
  compute/sync/training/stop occurred.
- post-stop scope guidance: no next autonomous model objective is selected.
  The only useful next actions are: reduced claim/deadline packaging with
  fail-closed model honesty; a new consented-data/source-review milestone
  before more ML; or a focused API/GPT research pass seeded with M3AE-AP
  evidence to design a future plan. None of those authorizes immediate Brev
  training, crop-normalization ablation, recognizer training, export, or model
  promotion.
- compute lifecycle update: latest user instruction makes Brev default-off
  when unused. `asl-pilot-rawframe-001` should be stopped and verified whenever
  no approved remote training job is queued/running. If the CLI returns success
  but the workspace still reports `RUNNING`, record the failed stop
  verification and surface it as a human cost-control blocker.
- exact next action:
  `stop_reduced_claim`.

M3AF Reduced product claim target:

- active prompt:
  [`docs/model/return-to-form-reduced-product-claim-goal-loop-prompt.md`](return-to-form-reduced-product-claim-goal-loop-prompt.md);
- activation: user explicitly selected getting the pair moving again after
  M3AE-AP stopped, with Brev/GPU cost-control procedures preserved;
- evidence source:
  [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json);
- required artifact:
  [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md);
- required proof: model/tracker claim inventory, supported learn-only demo
  path, unsupported claims, commands run, Brev status/stop verification,
  no-pretrained/source/final-gate boundaries, and exactly one next action;
- exact next action choices:
  `continue_reduced_product_packaging`, `stop_human_demo_review`,
  `new_data_or_source_review_required`, or `escalate_strategy_research`;
- hard boundary: no Detector 0 training, recognizer training,
  crop-normalization ablation, generic microprobe retry, controlled
  clip-heldout evaluation, broad route, source approval/import, generated
  pseudo-labels, pretrained detector/landmark use, export, model-card
  promotion, product threshold selection, final-readiness claim, Brev compute,
  duplicate worker, final-gate weakening, or push.
- result: M3AF reduced-claim packaging wrote
  [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md)
  (`717144bf12f3916546aa73bcb7cb7d5eeb1abf518561822c005c36922a4551b4`)
  and clarified the main practice route copy so not-trained sessions present
  as learn-only/local practice rather than live recognition. The artifact
  records fail-closed model/tracker status, supported demo path, unsupported
  claims, commands, Brev stop verification failure, final-promotion blocker
  separation, and exactly one next action.
- exact next action:
  `stop_human_demo_review`.
- observer decision: STOP for human demo review. Keep the loop parked until the
  user explicitly chooses demo/content/scope follow-up, new data/source review,
  Brev cost-control handling, or strategy research.

M3AG Human demo review target:

- active prompt:
  [`docs/model/return-to-form-human-demo-review-goal-loop-prompt.md`](return-to-form-human-demo-review-goal-loop-prompt.md);
- activation: user explicitly selected pushing forward from the M3AF
  `stop_human_demo_review` state and requested GPT Pro research only if a
  technical blocker appears;
- evidence source:
  [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md);
- required artifact:
  [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md);
- required proof: inspected `/`, `/lesson`, and `/validation` paths or their
  current smoke equivalents, pass/fail audit evidence, any scoped product/copy
  changes, remaining blockers, Brev state, and exactly one next action;
- exact next action choices:
  `continue_human_demo_review`, `stop_for_live_demo`,
  `content_or_ux_scope_required`, `new_data_or_source_review_required`, or
  `escalate_strategy_research`;
- hard boundary: no Detector 0 training, recognizer training,
  crop-normalization ablation, model microprobe, controlled clip-heldout
  evaluation, broad route, source approval/import, generated pseudo-labels,
  pretrained detector/landmark use, export, model-card promotion, product
  threshold selection, final-readiness claim, Brev compute, duplicate worker,
  final-gate weakening, or push.
- result: first M3AG human-demo slice wrote
  [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md)
  (`939c6d8d02b97d4b331eed39418086dbb73da0cfee6a2e02954512b0ab44c083`)
  and changed the main practice sampling status from `Checking your attempt.`
  to `Sampling local camera frames.` so the not-trained demo no longer implies
  automatic ASL correctness review while local camera frames are being sampled.
  Lesson/practice fail-closed audits pass, the existing lesson Playwright smoke
  remains passed, and Brev stop verification still reports the unused A100
  worker as `RUNNING` after name, id, and `--all` stop attempts.
- remaining bounded demo blocker: `/validation` still renders the older
  Round-001 task-026 progress ledger even though the top matrix remains
  fail-closed; clean up that status surface before live-demo stop.
- result: second M3AG human-demo slice refreshed the `/validation` claim-matrix
  progress ledger and route panel so the reviewer surface now reports
  `Mission 3AG`, the M3AF/M3AG reduced learn-only demo state, and human live
  review as the next step instead of older task-026 collection and Brev-training
  wording. The same fail-closed claim status is preserved:
  `no_active_claim_rawframe_not_trained`, active CV claim `null`, browser lane
  `not_trained`, `cv_supported_count=0`, and `learn_only_count=100`. The
  refreshed M3AG artifact hash is
  `23362a2ad0288b4e4e4c4c2fde01feb96f374bf1174d730861ca5eb1388b8b83`.
- exact next action:
  `stop_for_live_demo`.
- observer decision: STOP for live demo review. Keep the loop parked until the
  user live-reviews the reduced `/`, `/lesson`, and `/validation` demo path or
  explicitly selects content/UX scope, new data/source review, Brev
  cost-control handling, or strategy research.

M3AH Overnight completion target:

- active prompt:
  [`docs/model/return-to-form-overnight-completion-goal-loop-prompt.md`](return-to-form-overnight-completion-goal-loop-prompt.md);
- activation: user explicitly superseded the M3AG `stop_for_live_demo`
  checkpoint and requested an overnight completion push through 2026-05-27
  04:00 America/Chicago, including bounded Brev usage, intentional
  dataset/vocabulary choices, Detector 0 / TCN-style scratch model work when
  evidence supports it, product interactivity, exhaustive testing, and
  research/backtracking when approaches fail;
- Brev receipt:
  [`docs/validation/return-to-form-overnight-brev-readiness-v1.json`](../validation/return-to-form-overnight-brev-readiness-v1.json);
- initial approved vocabulary/source:
  Tier 0 PopSign `please`, `table`, `dad`, `grandpa`, `hat`;
- first required proof: sync the current repo and required data to the existing
  `asl-pilot-rawframe-001` worker, prove remote prompt/data/annotation/tensor
  presence, prove `.venv` torch/CUDA/A100 readiness, and select exactly one
  next bounded Detector 0, recognizer, product, or data/vocabulary action;
- compute envelope: existing worker first, no duplicate worker unless the
  existing worker is proven unusable, budget ceiling 250 USD for this push,
  max-runtime/max-spend/kill-condition receipt before each remote run, copied
  artifacts or no-artifact reason before teardown, verified stop attempt after
  remote work is complete;
- hard boundary: no pretrained detector/landmark/backbone/pseudo-label path,
  no broad 75/95-label training before a coherent small proof, no source
  shortcut, no raw learner video upload, no hand-edited model-card promotion,
  no final-readiness claim without validation gates, no push, and no destructive
  worker reset/delete without explicit user approval.
- exact next action:
  `sync_current_repo_and_run_remote_preflight`.
- result: M3AH activation plus follow-up preflight synced the current repo and
  data allowlist to Brev, including `data/annotations`; proved the active
  prompt and Tier 0 packet/manifests/tensors/raw paths exist remotely; proved
  `/home/shadeform/asl-pilot/.venv/bin/python` imports `torch 2.12.0+cu130`
  with CUDA on `NVIDIA A100-SXM4-80GB`; and ran one bounded
  `motion_2d_temporal_cnn` Tier 0 CUDA smoke. The smoke trained from random
  initialization with `pretrained_components: []`, wrote ignored copied-back
  artifacts under `output/m3ah-tier0-cuda-smoke/`, improved capped train
  accuracy from `0.232` to `0.472`, and held capped validation accuracy at
  `0.390625`. Receipt:
  [`docs/validation/return-to-form-overnight-cuda-smoke-v1.json`](../validation/return-to-form-overnight-cuda-smoke-v1.json).
- updated next action:
  `select_next_bounded_model_or_product_slice_from_cuda_smoke`.

M3DM Resumed Brev TCN microexperiment target:

- active prompt:
  [`docs/model/return-to-form-resumed-brev-tcn-microexperiment-goal-loop-prompt.md`](return-to-form-resumed-brev-tcn-microexperiment-goal-loop-prompt.md);
- activation: user explicitly superseded the M3DL product/cost STOP and
  renewed the full-project completion objective, including bounded Brev usage
  on the existing A100, intentional dataset/vocabulary choices, Detector 0 /
  TCN-style scratch model work when evidence supports it, interactivity, and
  honest backtracking;
- selected slice: one full-split high-signal region-grid
  `true_temporal_convnet_region_grid` A100 smoke with pre-run sync, dry-run
  input-contract proof, timed training, evaluation, copyback, receipt, and one
  next action;
- rationale: M3AW proved the true-TCN path and region-axis contract but failed
  as a capped local smoke, M3AX proved tiny-subset train-fit, and M3AH proved
  A100 training works but the PopSign motion-CNN result was not promotable;
  this is the next bounded evidence-producing run before another speculative
  training retry or product-only fallback;
- hard boundary: no broad labels, no pretrained detector/landmark/backbone/
  pseudo-label path, no source/manifest/tensor/vocabulary mutation, no duplicate
  worker, no worker delete/reset, no model-card promotion, no export, no browser
  activation, no final-readiness or ASL-correctness claim, no raw learner video
  upload, and no push;
- exact next action:
  `run_bounded_high_signal_region_grid_tcn_brev_smoke`.

M3DM result and M3DN repair target:

- M3DM executor commit `111ee10` validated the existing A100 worker, synced the
  repo/data allowlist, proved CUDA readiness, and ran the remote dry-run. The
  dry-run failed before timed training because the active command used
  `--region-grid-tcn-training-smoke`, while the current source guard still
  required the older M3AW output dir and caps. Receipt:
  [`docs/validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json`](../validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json).
- Observer commit `c4ac191` recorded the STOP and provider stop attempts, but
  the supervising user instruction now authorizes continuing through this narrow
  source/prompt contract blocker instead of parking the project.
- active M3DN prompt:
  [`docs/model/return-to-form-region-grid-tcn-brev-guard-fix-goal-loop-prompt.md`](return-to-form-region-grid-tcn-brev-guard-fix-goal-loop-prompt.md);
- selected M3DN slice: preserve the old M3AW capped local dry-run contract,
  add an explicit M3DM-compatible bounded policy for
  `output/m3dm-high-signal-region-grid-tcn-brev`, prove both dry-runs locally,
  and write a tracked guard-fix receipt;
- no timed Brev training should run in M3DN;
- exact M3DN next action after both dry-runs pass:
  `continue_bounded_brev_tcn_smoke_after_guard_fix`;
- pre-authored follow-on prompt:
  [`docs/model/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-goal-loop-prompt.md`](return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-goal-loop-prompt.md).

M3DN result and M3DO active target:

- M3DN executor commit `5fc2811` fixed the region-grid TCN smoke guard while
  preserving the old M3AW capped local dry-run contract.
- M3DN receipt:
  [`docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json)
  is `status=completed`, proves both the M3AW and M3DM local dry-runs pass,
  and selects `continue_bounded_brev_tcn_smoke_after_guard_fix`.
- active M3DO prompt:
  [`docs/model/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-goal-loop-prompt.md`](return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-goal-loop-prompt.md);
- selected M3DO slice: one bounded remote high-signal region-grid
  `true_temporal_convnet_region_grid` smoke on the existing A100 worker, with
  local audits, Brev state/process safety, sync, remote dry-run, exactly one
  timed `timeout 2700` training command, evaluation, copyback, receipt, and
  one next action;
- hard boundary: no broad labels, no pretrained detector/landmark/backbone/
  pseudo-label path, no source/manifest/tensor/vocabulary mutation, no
  duplicate worker, no worker delete/reset, no model-card promotion, no export,
  no browser activation, no final-readiness or ASL-correctness claim, no raw
  learner video upload, and no push.

M3DO result and M3DP active target:

- M3DO executor commit `0ac94d1` proved the repaired remote high-signal
  region-grid true-TCN dry-run path, then the single timed training command
  failed before epoch metrics in the first DataLoader batch. The failure was
  `NotImplementedError: Padding size 4 is not supported for 5D input tensor`
  in `augment_raw_rgb_frames_mild` via `torch.nn.functional.pad`; no checkpoint,
  training provenance, validation report, calibrated provenance, prediction
  sidecar, or copyback artifacts were written. Receipt:
  [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json).
- Observer 470 found no active remote training process and sent default-off
  stop commands by worker name, worker id, and `--all`; `brev ls --json` still
  reported `asl-pilot-rawframe-001` as `RUNNING`, `READY`, and `HEALTHY`. No
  delete/reset is authorized.
- active M3DP prompt:
  [`docs/model/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-goal-loop-prompt.md`](return-to-form-region-grid-tcn-5d-augmentation-diagnosis-goal-loop-prompt.md);
- selected M3DP slice: one local/no-spend 5D augmentation/source-policy
  diagnosis, with scoped repair if justified, M3AW and M3DM dry-run compatibility
  proof, a local no-fit one-batch DataLoader preflight, a tracked receipt, and
  exactly one next action;
- hard boundary: no Brev exec/sync/training/copy/lifecycle command, fitting,
  backward/optimizer/epoch training, checkpoint write, evaluation, copyback,
  broad labels, pretrained detector/landmark/backbone/pseudo-label path,
  source-register/manifest/tensor/vocabulary mutation, duplicate worker,
  worker delete/reset, model-card promotion, export, browser activation, final
  readiness or ASL-correctness claim, raw learner video upload, or push.

M3DP result, M3DQ result, M3DR result, M3DS result, M3DT result, M3DU result, M3DV result, and M3DW active target:

- M3DP executor commit `1441566` fixed the region-grid mild-augmentation path
  for 5D `T,R,C,H,W` tensors while preserving the older 4D path. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json`](../validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json)
  is `status=completed_local_5d_augmentation_fix`, proves the M3AW capped
  dry-run and M3DM full-split dry-run still pass, proves a no-fit one-batch
  high-signal region-grid DataLoader path with mild augmentation, and selects
  `continue_bounded_brev_tcn_smoke_after_5d_augmentation_fix`.
- Observer 472 committed `0c4c072` as a cost-control STOP because the next
  action spent fresh Brev compute; the supervising user then explicitly asked
  to get the pair moving again under oversight for M3DQ.
- M3DQ executor commit `cddcfa7` verified local audits, provider/process
  safety, and repo/data sync, then ran the required remote dry-run once. The
  dry-run failed before training with
  `Manifest validation failed: region-grid TCN training smoke requires --output-dir output/m3aw-region-grid-tcn-local-smoke or output/m3dm-high-signal-region-grid-tcn-brev`.
  The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json)
  is `status=remote_dry_run_failed_no_training`, records zero timed training
  commands, no artifacts, default-off attempts, and selects
  `continue_local_tcn_failure_diagnosis_after_m3dq`.
- M3DR executor commit `7fed3c9` fixed the local M3DQ output-dir guard,
  preserved old M3AW/M3DM dry-run compatibility, corrected the M3AW prompt typo
  from unsupported `latest` to `final`, and proved M3AW, M3DM, and intended
  M3DQ local dry-runs. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json)
  is `status=completed_local_output_guard_and_prompt_contract_fix` and selects
  `continue_bounded_brev_tcn_smoke_after_m3dq_guard_fix`.
- Observer 476 committed `c7537e2` as a cost-control STOP because the next
  action spent fresh Brev compute; the supervising user then authorized
  continuing the pair overnight and Mission 3DS converted that approval into
  exactly one bounded remote smoke.
- M3DS executor commit `3572409` passed local audits, provider/process safety,
  repo/data sync, and the fixed M3DQ remote dry-run on the existing worker. The
  single allowed timed training command failed before training with
  `Manifest validation failed: --require-input-contract is a no-training input-contract audit and requires --dry-run`.
  No checkpoint, provenance, output directory, evaluation, copyback, promotion,
  export, browser activation, duplicate worker, delete/reset, raw learner upload,
  push, or final claim occurred. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json)
  is `status=timed_training_failed_before_training_no_artifacts` and selects
  `continue_local_tcn_failure_diagnosis_after_m3ds`.
- M3DT executor commit `e7411ca` completed the local/no-spend command-policy
  diagnosis. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3ds-input-contract-command-diagnosis-v1.json`](../validation/return-to-form-region-grid-tcn-m3ds-input-contract-command-diagnosis-v1.json)
  is `status=completed_prompt_command_contract_repair`, proves the source
  policy is correct, and records that the remote dry-run keeps
  `--dry-run --require-input-contract rgb_regions_grid_v1` while the timed
  training command removes `--require-input-contract`.
- Observer 481 committed `4943c41` as a cost-control STOP because the next
  action spent fresh Brev compute; the supervising user then explicitly
  reauthorized unblocking Brev usage and continuing the completion push.
- M3DU executor commit `bc0f3d3` completed the approved bounded remote
  high-signal region-grid TCN smoke on the existing Brev worker after the M3DT
  command-contract fix. The dry-run passed with `rgb_regions_grid_v1`, exactly
  one timed CUDA training command completed, evaluation and copyback ran, and
  ignored local artifacts were copied to
  `output/m3dq-high-signal-region-grid-tcn-brev/`. The result is weak and not
  promotable: validation top-1 `0.2593`, validation macro-F1 `0.1536`, test
  top-1 `0.1786`, test macro-F1 `0.0978`, selected threshold `0.28`, and test
  false-pass rate `0.0357`. The receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json)
  selects `continue_m3dq_metric_triage_no_remote`.
- M3DU default-off handling found no training process and ran stop by name, id,
  and `--all`, but the provider still reported `asl-pilot-rawframe-001` /
  `2hl1hytty` as `RUNNING`, `READY`, and `HEALTHY`.
- M3DV executor commit `85fe13b` completed local/no-spend metric triage. The
  receipt:
  [`docs/validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json)
  records an operational CUDA train/eval path but weak, non-promotable metrics
  and prediction collapse mostly to `white` and `uncle`; it selects
  `stop_for_human_cost_control_review`.
- Observer STOP commit `fb0a90d` added the stop sentinel after repeating
  default-off attempts; no delete/reset occurred in that observer pass.
- The supervising user then explicitly asked to continue the overnight
  completion push and unblock Brev usage. Supervisor session 486 confirmed the
  stale `massedcompute_A100_sxm4_80G_DGX` worker was not listed by stoppable
  A100 search, found no active training/GPU process, confirmed remote output
  directories were mirrored locally, ran `brev delete asl-pilot-rawframe-001`,
  and verified `brev ls --json` returned `"workspaces": null`. Receipt:
  [`docs/validation/return-to-form-brev-nonstoppable-worker-delete-v1.json`](../validation/return-to-form-brev-nonstoppable-worker-delete-v1.json).
- active M3DW prompt:
  [`docs/model/return-to-form-overnight-recovery-brev-unblock-goal-loop-prompt.md`](return-to-form-overnight-recovery-brev-unblock-goal-loop-prompt.md);
- selected M3DW slice: one local/no-spend, no-training post-unblock route packet
  that validates the Brev-delete/M3DV/M3DU receipts, verifies empty Brev state,
  compares ASL Citizen, PopSign, SemLex/ASL-LEX, Detector 0/crop, and
  fail-closed product routes, then selects exactly one next milestone.
- hard boundary: no Brev exec/sync/copy/start/stop/delete/reset/lifecycle,
  new worker, training, evaluation rerun, broad labels, pretrained detector/
  landmark/backbone/pseudo-label path, source-register/manifest/tensor/
  vocabulary mutation, model-card promotion, export, browser activation, final
  readiness or ASL-correctness claim, raw learner video upload, push, or further
  remote training without a fresh prompt, stoppable-worker compute envelope,
  and explicit human approval.

M3EH/M3EH-R result, M3EJ completion, and Tiny2 active target:

- M3EG executor commit `71e857e` completed one local/no-Brev/no-training
  strategy downscope packet after M3EF and observer 508. The receipt:
  [`docs/validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json`](../validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json)
  selected `stop_for_human_model_input_strategy_review`.
- Observer commit `4013cc2` added `<stop-orchestrator/>` and parked the pair.
- The supervising user then explicitly instructed the supervisor to restart the
  pair, continue the completion push, and unblock Brev usage under oversight.
  This supplies the human approval missing from M3EG, but does not relax the
  fail-closed claim boundary.
- Supervisor activation added fresh output namespaces so new attempts do not
  overwrite old ignored artifacts:
  `output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit` and
  `output/m3eh-high-signal-region-grid-tcn-brev`.
- M3EH executor commits `e808b5a` and `76e6635` completed one bounded Brev
  relaunch preflight. The receipt:
  [`docs/validation/return-to-form-m3eh-bounded-brev-relaunch-preflight-v1.json`](../validation/return-to-form-m3eh-bounded-brev-relaunch-preflight-v1.json)
  selected `continue_remote_environment_repair_no_training`.
- M3EH proved local audits and local dry-runs, created exactly one stoppable
  `asl-pilot-m3eh-l40s-001` L40S worker, synced the repo/data allowlist, and
  stopped the worker. CUDA proof failed after installing
  `torch==2.12.0+cu130` against driver `565.57.01`, so remote dry-runs were
  intentionally not run.
- M3EH-R was the previous infrastructure-only target. Its purpose was to repair
  CUDA compatibility and run dry-runs, not to authorize timed training or model
  claims.
- The supervising user then asked to apply the GPT Pro strategy result to the
  repo goals, milestones, and steering. That result treats M3DU/M3EF as real
  negative recognizer evidence, not noise.
- M3EJ completed at observer commit `296b5eb`. It wrote
  [`docs/validation/return-to-form-m3ej-pro-strategy-steering-v1.json`](../validation/return-to-form-m3ej-pro-strategy-steering-v1.json),
  demoted the broad M3EI Fresh5 fit path, preserved M3EH/M3EH-R as
  infrastructure-only, and added the Tiny2/Tiny3 gated proof prompt.
- M3EK executor commit `a33014f` completed one local/no-spend/no-training
  Tiny2/Tiny3 preparation packet. The receipt:
  [`docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json`](../validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json)
  selected `continue_tiny2_one_batch_overfit_and_shuffle_control_no_brev`.
- M3EK selected `table` and `hello` from the approved ASL Citizen high-signal
  region-grid manifests as the first Tiny2 premise, reserved `black` as a gated
  Tiny3 extension, rejected broad Fresh5 continuation, and defined
  source/licensing, split, one-batch overfit, label-shuffle, class-collapse,
  open-set, browser-parity, abort, and promotion gates.
- M3EL executor commit `72a22c3` completed one local/no-Brev bounded Tiny2
  one-batch overfit and deterministic label-shuffle control diagnostic. The
  receipt:
  [`docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json`](../validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json)
  selected `continue_tiny2_heldout_noncollapse_probe_no_brev`.
- M3EL proved the scratch `true_temporal_convnet_region_grid` path can memorize
  one deterministic `table`/`hello` fixed batch: real-label accuracy `1.0`,
  per-label recall `1.0`, and dominant predicted-class fraction `0.5`. The
  inverted-label shuffle control also memorized the same batch, so this is
  capacity-only evidence and not held-out or generalized signal.
- M3EM executor commit `e9497b5` completed one local/no-Brev bounded Tiny2
  held-out noncollapse probe. The receipt:
  [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json)
  selected `continue_detector0_source_region_receipts_no_brev`.
- M3EM proved train sanity but failed held-out signal: train accuracy `1.0`,
  held-out accuracy `0.5` at the two-class chance baseline, held-out macro-F1
  `0.3333333333333333`, predictions collapsed to `hello` for all 8 held-out
  clips, and `table` had zero recall. This blocks a future no-Brev open-set
  threshold probe.
- active M3EN prompt:
  [`docs/model/return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md`](return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md);
- selected M3EN slice: one local/no-Brev/no-training Detector 0/source-region
  receipt packet from existing approved artifacts only; inspect M3EM/M3EL/M3EK
  tiny-proof receipts, Detector 0 objectness/support/class-invariant/fixed-
  geometry receipts, fixed/materialized region receipts, source register, and
  `table`/`hello` high-signal region-grid manifest metadata; connect M3EM's
  held-out `table` collapse to source/region/Detector 0 evidence; record the
  result in
  `docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`;
  keep fail-closed claim surfaces unchanged; and select exactly one next
  action.
- superseded prompt:
  [`docs/model/return-to-form-m3ei-popsign-fresh5-bounded-brev-fit-goal-loop-prompt.md`](return-to-form-m3ei-popsign-fresh5-bounded-brev-fit-goal-loop-prompt.md)
  is retained only as historical context. It must not be used as autonomous
  authorization for a broad PopSign Fresh5 timed training run.
- new strategic priority order:
  1. ship or refresh the fail-closed non-recognition MVP for the deadline;
  2. preserve M3EH/M3EH-R as infrastructure receipts only;
  3. prepare a Tiny2/Tiny3 gated signal proof before any recognizer Brev spend;
  4. build Detector 0/source/region receipts as the durable representation
     unlock;
  5. spend more Brev only after entry gates prove learnable signal.
- required gates before any future recognizer compute: source/licensing receipt,
  separable Tiny2/Tiny3 label selection, signer-separated splits where
  applicable, one-batch overfit at least `0.95` train accuracy, label-shuffle
  control interpretation, no prediction collapse, held-out noncollapse signal,
  open-set/hard-negative threshold plan, browser export/parity instrumentation,
  explicit abort gates, and explicit promotion gates.
- hard boundary: no Brev lifecycle/spend, broad Fresh5 run, recognizer
  training/fitting/evaluation rerun, label expansion beyond `table`/`hello`,
  source/media/manifest/tensor/vocabulary/packet mutation, Detector 0 training,
  pretrained detector/landmark/backbone/generated-label path, checkpoint/model
  artifact, export, promotion, browser activation, product claim expansion,
  raw learner video upload, push, duplicate worker, non-stoppable worker,
  worker delete, or worker reset in M3EN.

M3EN through M3FS results, M3FT parked fallback, and M3FU active target:

- M3EN executor commit `99550d0` completed the local/no-Brev/no-training
  Detector 0/source-region receipt packet. The receipt:
  [`docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`](../validation/return-to-form-m3en-detector0-source-region-receipts-v1.json)
  records that candidate source/region evidence exists, but the inspected
  objectness target remains table-confounded and not supportable without human
  annotation/target-scope approval. It selected
  `stop_for_human_detector0_annotation_budget`.
- Observer commit `85be500` added `<stop-orchestrator/>` and parked the loop.
  The supervising user then explicitly superseded that STOP and authorized the
  overnight completion push through 04:00 America/Chicago, including bounded
  Brev usage, deliberate dataset/vocabulary choices, Detector 0 / TCN-style
  scratch-model work when evidence supports it, product interactivity, research,
  and backtracking when approaches fail. This approval does not relax the
  no-pretrained, source/provenance, raw learner video, fail-closed claim,
  promotion, or final-readiness gates.
- M3EO executor commit `deb5517` completed the bounded overnight unblock packet.
  The receipt:
  [`docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`](../validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json)
  reconciled the M3EN blocker against the expanded/union Detector 0 lineage and
  selected `continue_brev_sync_preflight_no_training`.
- M3EO target decision: independent-hand/general objectness is not supportable
  now; fixed-region evidence is diagnostic accounting only; the current
  Detector 0 target path is target-specific
  `table_two_hand_union_or_contact_region`, with no class-invariant objectness,
  browser/product, or final-readiness claim. Held-out behavior remains failing
  design/remediation evidence.
- M3EO Brev decision: the existing `asl-pilot-m3eh-l40s-001` worker was
  controllable and stopped, and the L40S was idle with driver `565.57.01` /
  CUDA `12.7`; the remote shell reported `pwd` as `/home/ubuntu`, but the
  approved probe checked `/home/shadeform/asl-pilot/.venv/bin/python`, which
  was absent or non-executable.
- active M3EP prompt:
  [`docs/model/return-to-form-m3ep-brev-sync-preflight-no-training-goal-loop-prompt.md`](return-to-form-m3ep-brev-sync-preflight-no-training-goal-loop-prompt.md);
- selected M3EP slice: one bounded no-training Brev checkout/sync preflight on
  the existing stopped L40S worker; inspect `/home/ubuntu/asl-pilot` versus
  `/home/shadeform/asl-pilot`, run `scripts/brev_sync_repo.sh` at most once if
  the checkout is absent or stale, probe only the existing remote Python/CUDA
  environment, stop the worker, and record exactly one next action.
- compute envelope for M3EP: existing worker only, maximum runtime 20 minutes,
  maximum expected spend 3 USD, no duplicate worker, no worker delete/reset, no
  training, no package install, no source import, no product/browser/final
  claim change, and default-off stop/verification after preflight.
- exact next action set: `continue_brev_cuda_environment_repair_no_training`,
  `continue_brev_remote_dry_run_preflight_no_training`,
  `continue_detector0_union_target_local_smoke_no_brev`,
  `continue_fail_closed_interactive_product_hardening`,
  `continue_openai_or_gpt_pro_research`, or
  `stop_for_provider_or_budget_blocker`.
- hard boundary: no recognizer training/fitting/evaluation rerun, Detector 0
  training, architecture search, package install, source/media import,
  source-register/manifest/tensor/vocabulary mutation, packet mutation, label
  expansion, generated labels, pretrained detector/landmark/backbone/embedding/
  teacher path, model artifact, checkpoint, export, promotion, browser
  activation, product-runtime mutation, raw learner upload, duplicate worker,
  worker delete/reset, broad remote run, push, or unsupported claim in M3EP.
- M3EP executor commit `a41624a` completed that bounded preflight and selected
  `stop_for_provider_or_budget_blocker`. The worker started but remote SSH never
  reached a shell, Brev reported the worker `UNHEALTHY`, no sync/Python/CUDA
  probe occurred, and no training/package install/source mutation/export/
  promotion/browser activation happened.
- Observer commits `bf5f3e7` and `911f75a` parked the loop and corrected the
  final default-off evidence after Brev briefly reported the worker running
  again. Final retained-worker state is
  `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.
- The supervising user then explicitly superseded the parked Brev/provider STOP
  and renewed the overnight completion objective: keep the pair moving, unblock
  Brev usage, build toward detector/TCN product work, improve interactivity,
  research/backtrack when evidence demands it, and stay intentional about
  dataset/vocabulary choices. This approval authorizes a bounded
  recovery/readiness envelope, not unbounded sweeps or final readiness claims.
- M3EQ executor commit `a9afe8b` completed the bounded recovery/readiness
  packet and selected `continue_bounded_brev_tcn_training_smoke`. The receipt:
  [`docs/validation/return-to-form-m3eq-brev-recovery-readiness-v1.json`](../validation/return-to-form-m3eq-brev-recovery-readiness-v1.json)
  records that the retained worker reached a remote shell at `/home/ubuntu`,
  selected `/home/ubuntu/asl-pilot`, synced the stale checkout once, proved
  CUDA torch `2.12.0+cu126` on one `NVIDIA L40S`, and passed the no-training
  dry-run/check-files command for 139 high-signal `rgb_regions_grid_v1` clips.
  The worker was stopped afterward and verified
  `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.
- M3ER executor commit `32f731c` completed the bounded remote training-smoke
  attempt but stopped at the required dry-run/check-files gate before training.
  The receipt:
  [`docs/validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json`](../validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json)
  records that the retained worker started, proved CUDA torch `2.12.0+cu126`
  on one `NVIDIA L40S`, synced once, and then rejected
  `output/m3er-high-signal-region-grid-tcn-brev` because the existing
  region-grid TCN smoke output-dir allowlist accepts only M3AW, M3DM, M3DQ, and
  M3EH namespaces. No timed training, checkpoint, evaluation, copyback, source
  mutation, dependency mutation, export, promotion, browser activation, product
  runtime mutation, worker creation/delete/reset, push, or pretrained/generated
  label path occurred. Final worker state was
  `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.
- M3ES executor commit `a9e5eba` completed the local/no-remote/no-spend
  contract repair and selected
  `continue_bounded_brev_tcn_training_smoke_after_m3es_contract_fix`. The
  receipt:
  [`docs/validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json`](../validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json)
  records an explicit M3ER full-split output-dir policy, preserved M3AW/M3DM/
  M3DQ/M3EH contracts, passed local dry-runs for M3AW/M3DM/M3DQ/M3EH and M3ER,
  preserved fail-closed claim surfaces, and verified the retained worker
  `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`. No Brev start/exec/sync/
  copy, remote dry-run, remote training, checkpoint, evaluation, export,
  promotion, browser activation, product mutation, source/data/dependency
  mutation, push, worker creation/delete/reset, or pretrained/generated-label
  path occurred.
- M3ET executor commit `45775cf` completed the bounded remote training-smoke
  attempt but stopped at the timed-command gate before training. The receipt:
  [`docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`](../validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json)
  records that the retained worker started, proved CUDA torch `2.12.0+cu126`
  on one `NVIDIA L40S`, synced once, verified hashes, and passed the remote
  dry-run/check-files command for
  `output/m3er-high-signal-region-grid-tcn-brev` and `rgb_regions_grid_v1`.
  The single timed training command then failed before training because it
  included `--require-input-contract`, which is a no-training dry-run audit
  flag and requires `--dry-run`. No second training command, checkpoint,
  evaluation, copyback, source mutation, dependency mutation, export,
  promotion, browser activation, product runtime mutation, worker
  creation/delete/reset, push, or pretrained/generated-label path occurred.
  Final worker state was `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.
- M3EU executor commit `ea6ba11` completed the local/no-remote/no-spend
  command-contract diagnosis and selected
  `continue_bounded_brev_tcn_training_smoke_after_m3eu_command_fix`. The
  receipt:
  [`docs/validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json`](../validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json)
  records that the source policy is correct: `--require-input-contract` is a
  dry-run/check-files-only audit guard. It proved the M3ET dry-run shape with
  the input-contract audit flag, proved the timed-command shape without that
  flag in dry-run form, preserved fail-closed claim surfaces, and verified the
  retained worker `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`. No Brev
  start/exec/sync/copy, remote work, non-dry-run local training, checkpoint,
  evaluation, copyback, export, promotion, browser activation, product-runtime
  mutation, source/data/dependency mutation, push, worker creation/delete/reset,
  or pretrained/generated-label path occurred.
- M3EV executor commit `4bffeb8` completed the bounded remote training-smoke
  attempt and selected `continue_m3ev_metric_triage_no_remote`. The receipt:
  [`docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json`](../validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json)
  records that the retained worker started, proved CUDA torch `2.12.0+cu126`
  on one `NVIDIA L40S`, synced once, verified hashes, passed the remote dry-run
  with `--dry-run --require-input-contract rgb_regions_grid_v1`, ran exactly
  one timed non-dry-run training command without `--require-input-contract`,
  evaluated once, copied back scoped artifacts under ignored `output/`, and
  stopped/default-off. The metrics are weak and non-promotable: validation
  top-1 `0.2222222222222222`, validation macro-F1 `0.13796992481203008`, test
  top-1 `0.17857142857142858`, test macro-F1 `0.11591836734693879`, prediction
  concentration on `white`, and multiple zero-recall labels. No second training
  command, source/data/dependency mutation, export, promotion, browser
  activation, product runtime mutation, worker creation/delete/reset, push, or
  pretrained/generated-label path occurred.
- M3EW executor commit `78b82a9` completed the local/no-remote/no-training
  metric-triage packet and selected `continue_openai_or_gpt_pro_research`. The
  receipt:
  [`docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json)
  verified copied M3EV artifact availability/hashes and fail-closed claim
  surfaces, then classified the blocker as repeated weak learnability without a
  local source-code, evaluation-contract, or input-contract repair. No Brev
  command, training, evaluation rerun, export, promotion, browser activation,
  product runtime mutation, source/data/dependency mutation, worker action,
  push, or pretrained/generated-label path occurred.
- Observer 547 API research:
  [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md)
  recommends `redirect_to_no_training_strategy_downscope`: no more autonomous
  ML retries now; write a fail-closed product downscope contract that separates
  safe learner value from blocked recognition/model claims.
- M3EX was superseded by the latest supervising-user instruction before an
  executor slice ran. The user explicitly asked to continue until 4am, unblock
  bounded Brev usage, build/test the product, and pursue the best model path
  with intentional dataset/vocabulary choices.
- supervisor preflight: the 25-label ASL Citizen lesson milestone dry-run with
  `--check-files --lesson-milestone --architecture motion_2d_temporal_cnn`
  passes locally against `data/manifests/lesson/rawframe-milestone/{train,
  validation,test}.json`; M3FB repaired the PopSign label-ladder stale
  `source_register.sha256` mismatch, and M3FC proved the 095-label ladder can
  pass local dry-run/check-files only through diagnostic
  `--allow-small-label-set`. PopSign still needs a first-class no-training/
  training-mode contract before any compute receipt or fitting route.
- M3EY executor commit `fa55035` completed one bounded retained-worker ASL
  Citizen 25-label lesson-model train/evaluate/copyback slice after supervisor
  commit `0bbfba6` repaired the output-dir contract. The receipt:
  [`docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json`](../validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json)
  records that the model is diagnostic-only and non-promotable: validation
  top-1 `0.19148936170212766`, validation macro-F1
  `0.1723174603174603`, test top-1 `0.17`, test macro-F1
  `0.15166666666666667`, diagnostic negative false-pass rate `0.4`, and 15
  zero-recall labels on validation and test. No export, promotion, browser
  activation, source/data mutation, push, final-gate weakening, or
  pretrained/generated-label path occurred. The retained worker was stopped
  after `brev stop --all` fallback and verified default-off.
- M3EY cleanup commit `9f8d656` completed observer NUDGE 553 by tracking the
  copied M3EY `validation-report.json` and `prediction-sidecar.json` sidecars
  as JSON evidence artifacts, leaving only `model_state.pt` ignored by
  `.gitignore`.
- M3EZ executor commit `153ef3f` completed one local/no-Brev practice UI
  hardening slice and selected `continue_product_browser_validation_no_recognition`.
  The receipt:
  [`docs/validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json`](../validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json)
  records that the no-model ready action now says `Save practice`, a future
  trained-checker path says `Check attempt`, and fail-closed claim surfaces
  stayed `not_trained` / empty active vocabulary. No Brev command, training,
  evaluation rerun, export, promotion, browser recognition activation,
  source/data mutation, raw learner upload, push, or pretrained/generated-label
  path occurred.
- M3FA executor commit `1db4938` completed one local/no-Brev browser-validation
  slice and selected `continue_popsign_source_register_manifest_repair`. The
  receipt:
  [`docs/validation/return-to-form-m3fa-product-browser-validation-no-recognition-v1.json`](../validation/return-to-form-m3fa-product-browser-validation-no-recognition-v1.json)
  records retained Playwright evidence that `Save practice` is visible, stale
  `Submit attempt` is absent, `Check attempt` is absent while no trained
  checker exists, the fail-closed hint is visible, and practice history updates.
  No Brev command, training, evaluation rerun, export, promotion, browser
  recognition activation, source/data mutation, raw learner upload, push, or
  pretrained/generated-label path occurred.
- M3FB executor commit `eadfe34` completed one local/no-Brev/no-training
  PopSign source-register manifest repair slice and selected
  `continue_popsign_label_ladder_local_dry_run_no_training`. The receipt:
  [`docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json`](../validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json)
  records that all 15 refreshed local diagnostic label-ladder manifests now
  bind to the current source-register hash
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`, with
  zero stale-hash matches after repair. The tracked summary
  [`docs/validation/popsign-label-ladder-manifests.json`](../validation/popsign-label-ladder-manifests.json)
  records refreshed hashes for the ignored local diagnostic manifest outputs.
  No Brev command, training, evaluation rerun, threshold tuning, export,
  promotion, browser recognition activation, source-register edit,
  source/media import, tensor/vocabulary/packet mutation, raw learner upload,
  push, readiness claim, ASL correctness claim, or pretrained/generated-label
  path occurred.
- M3FC executor commit `3905e5c` completed one local/no-Brev/no-training
  dry-run/check-files validation against the refreshed 095-label PopSign
  diagnostic ladder and selected
  `continue_popsign_label_ladder_training_mode_contract_repair_no_training`.
  The receipt:
  [`docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json`](../validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json)
  records that the prior stale-hash blocker is cleared from the local dry-run
  path, the command exited `0`, `training_status` was `dry_run_only`, no output
  directory was created, fail-closed claim surfaces stayed unchanged, and no
  Brev/training/fitting/evaluation/promotion path ran. The remaining blocker is
  that the current dry-run path only loads the 095-label ladder with
  `--allow-small-label-set`, a diagnostic escape hatch whose help text limits it
  to synthetic wiring tests.
- M3FD executor commit `f01feb0` completed one local/no-Brev/no-training
  contract repair and selected
  `continue_popsign_label_ladder_compute_receipt_no_training`. The receipt:
  [`docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json`](../validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json)
  records that `--popsign-label-ladder-diagnostic` validates the 095-label
  PopSign ladder with `--dry-run --check-files` and without
  `--allow-small-label-set`, creates no output directory, keeps
  `pretrained_components: []`, and rejects combining the new mode with
  `--allow-small-label-set`. No Brev command, training, evaluation rerun,
  export, promotion, browser activation, source/data/manifest/tensor/
  vocabulary mutation, push, readiness claim, ASL correctness claim, or
  pretrained/generated-label path occurred.
- M3FE executor commit `9a1cda8` completed one local/no-spend/no-training
  compute receipt and selected
  `continue_popsign_label_ladder_command_contract_fix_no_training`. The
  receipt:
  [`docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json`](../validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json)
  records read-only Brev state `STOPPED` / `COMPLETED` / `NOT READY` /
  `HEALTHY`, listed `l40s-48gb.1x` price `$1.74/hour`, a fresh 095-label
  diagnostic dry-run, and blockers: no future fitting route is compatible
  today because `--popsign-label-ladder-diagnostic` requires `--dry-run`, and
  `scripts/evaluate_rawframe_model.py` has no matching PopSign label-ladder
  evidence mode. No training, evaluation rerun, Brev lifecycle/spend, export,
  promotion, browser activation, source/data mutation, push, readiness claim,
  ASL correctness claim, or pretrained/generated-label path occurred.
- M3FF executor commit `bb99378` completed one local/no-Brev/no-training
  command-contract repair and selected
  `continue_popsign_label_ladder_evaluation_contract_fix_no_training`. The
  receipt:
  [`docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`](../validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json)
  records that `--popsign-label-ladder-training-smoke` validates the 095-label
  PopSign ladder with `--dry-run --check-files`, emits
  `popsign_label_ladder_training_smoke`, rejects `--allow-small-label-set`,
  rejects combining with `--popsign-label-ladder-diagnostic`, supports only
  `025-labels`, `050-labels`, and `095-labels`, and creates no output
  directory. No training, evaluation rerun, Brev lifecycle/spend, export,
  promotion, browser activation, source/data mutation, push, readiness claim,
  ASL correctness claim, or pretrained/generated-label path occurred.
- M3FG executor commit `8323825` completed one local/no-Brev/no-training
  evaluation-contract repair and selected
  `continue_popsign_label_ladder_compute_receipt_refresh_after_evaluation_contract_fix_no_training`.
  The receipt:
  [`docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json`](../validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json)
  records that `scripts/evaluate_rawframe_model.py` now recognizes
  `--popsign-label-ladder-training-smoke`, maps it to evidence mode
  `popsign_label_ladder_training_smoke`, validates only the 025/050/095
  label-ladder manifests for that mode, rejects incompatible evaluation flags,
  does not require a negative challenge manifest or final decode provenance
  for this bounded non-final smoke, and records future report finality as
  non-final/non-lesson/non-product/non-browser/non-promotion evidence. The
  095-label no-checkpoint evaluator probe exits `2` at the expected missing
  checkpoint and creates no report/provenance output. No training, completed
  checkpoint evaluation, Brev lifecycle/spend, export, promotion, browser
  activation, source/data mutation, push, readiness claim, ASL correctness
  claim, or pretrained/generated-label path occurred.
- M3FH executor commit `c10467b` completed one local/read-only/no-spend/
  no-training compute receipt refresh and selected
  `stop_for_human_training_budget_approval`. The receipt:
  [`docs/validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json`](../validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json)
  records that the PopSign label-ladder command and evaluator contracts are
  compatible for a future bounded 095-label fitting attempt, the retained L40S
  worker is `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`, current
  `l40s-48gb.1x` price evidence is `$1.74/hr`, and the future local/Brev
  envelopes are documented with caps, kill conditions, copyback/default-off
  plans, metric gates, and duplicate-worker avoidance. It also records that no
  current human approval exists for non-dry-run local fitting or Brev spend,
  and that the receipt alone is not authorization to run those routes.
- M3FH stopped prompt:
  [`docs/model/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-goal-loop-prompt.md`](return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-goal-loop-prompt.md);
- M3FI completed prompt:
  [`docs/model/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-goal-loop-prompt.md`](return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-goal-loop-prompt.md);
- M3FI executor commit `da52ecd` completed one local/no-spend bounded fitting
  sanity attempt and selected
  `continue_popsign_label_ladder_result_diagnosis_no_training`. The receipt:
  [`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](../validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json)
  records that the fitting command ran once, completed in 892 seconds, wrote
  the expected ignored checkpoint and training provenance under
  `output/m3ff-popsign-label-ladder-local-sanity/`, and preserved fail-closed
  claim surfaces. The one allowed evaluator command ran once and failed before
  report generation because the current 095-label train manifest is missing
  `vocabulary_review` evidence. No Brev lifecycle/spend, remote command,
  second fitting/evaluation attempt, source/data/manifest/tensor/vocabulary
  mutation, export, promotion, browser activation, push, readiness claim, ASL
  correctness claim, or pretrained/generated-label path occurred.
- M3FJ completed prompt:
  [`docs/model/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-goal-loop-prompt.md`](return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-goal-loop-prompt.md);
- M3FJ executor commit `ec8e412` completed one local/no-spend/no-training
  diagnosis of the M3FI result and selected
  `continue_popsign_label_ladder_evaluation_manifest_evidence_contract_repair_no_training`.
  The receipt:
  [`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`](../validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json)
  records that the M3FI artifacts still match their receipt hashes, all 15
  PopSign label-ladder manifests pass source-register/finality checks while
  lacking `vocabulary_review`, and the evaluator failure is an evidence-
  contract mismatch between the training-side label-ladder diagnostic manifest
  policy and the evaluator's later provenance/current-manifest gate. The
  one-epoch M3FI metrics remain weak diagnostic signal only and do not justify
  another fitting run, Brev compute, export, promotion, browser activation, or
  readiness claims.
- M3FK completed prompt:
  [`docs/model/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-goal-loop-prompt.md`](return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-goal-loop-prompt.md);
- M3FK executor commit `fc5d94e` completed one local/no-spend/no-training
  evaluator evidence-contract repair and selected
  `continue_popsign_label_ladder_post_repair_evaluation_probe_no_training`.
  The receipt:
  [`docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`](../validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json)
  records that only `scripts/evaluate_rawframe_model.py::validate_finality`
  changed. Missing `vocabulary_review` remains a hard error for final, lesson,
  reduced-real-data, region-grid, PopSign fresh5, and controlled-clip-heldout
  modes; for `--popsign-label-ladder-training-smoke` only, it becomes a
  diagnostic/non-final limitation reason. M3FK proved this with a direct
  no-report guard probe and did not train, fit, rerun evaluation, write
  reports, run Brev, mutate manifests or tensors, export, promote, activate
  browser recognition, push, or claim readiness.
- M3FL completed prompt:
  [`docs/model/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-goal-loop-prompt.md`](return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-goal-loop-prompt.md);
- M3FL executor commit `4cecedd` completed one local/no-spend/no-training
  post-repair evaluator probe and selected
  `continue_popsign_label_ladder_metric_triage_no_training`. The receipt:
  [`docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json`](../validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json)
  records that the existing M3FI checkpoint/provenance hashes matched, the
  output report path was absent before the probe, the single evaluator command
  passed the prior `vocabulary_review` gate, and scoped ignored
  `validation-report.json` was created with hash
  `24cc76caec4453d8a7ea266f9eb39108c368aa5df5858981d344c59160928065`.
  `calibrated-provenance.json` was not created because no negative-challenge
  manifest was provided. Metrics are weak diagnostic-only evidence:
  validation top-1 `0.010105263157894737`, validation macro-F1
  `0.0006163321188634017`, test top-1 `0.012742382271468145`, test macro-F1
  `0.0017700006858916142`, with 92 validation and 91 test zero-recall labels.
  The direct evaluator exit status was not captured because a zsh wrapper
  assigned to read-only `status` after report/stdout creation; the evaluator
  was not rerun. Claim surfaces stayed fail-closed and no training/fitting/
  second evaluator attempt/Brev lifecycle or spend/source or manifest mutation/
  export/promotion/browser activation/push/readiness claim occurred.
- M3FM stopped prompt:
  [`docs/model/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-goal-loop-prompt.md`](return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-goal-loop-prompt.md);
- M3FM executor commit `806a5fa` completed one local/no-spend/no-training
  metric triage over M3FL/M3FI/M3FJ/M3FK evidence and selected
  `escalate_popsign_label_ladder_training_strategy_research_with_local_evidence`.
  The receipt:
  [`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`](../validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json)
  records that the previous evaluator/report contract blocker is not current,
  the ignored M3FL report is present and hashed, metrics are weak diagnostic-
  only evidence, all claim surfaces remain fail-closed, and no evaluator rerun,
  training/fitting, Brev lifecycle/spend, source/manifest/tensor/vocabulary
  mutation, export, promotion, browser activation, push, or readiness claim
  occurred.
- Observer 584 API research:
  [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
  recommends `stop_for_human_model_strategy_review`: current evidence shows
  weak PopSign label-ladder learnability with no clear local repair, and
  further autonomous ML strategy, compute, source/manifest/crop, architecture,
  evaluator-rerun, export, promotion, or claim-expansion work requires human
  approval.
- M3FN completed prompt:
  [`docs/model/return-to-form-m3fn-deadline-fail-closed-demo-finish-goal-loop-prompt.md`](return-to-form-m3fn-deadline-fail-closed-demo-finish-goal-loop-prompt.md);
- M3FN executor commit `3864c1d` completed one local/no-spend deadline
  product-finish slice and selected `draft_final_fail_closed_demo_evidence_package`.
  The receipt:
  [`docs/validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json`](../validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json)
  records refreshed passing practice, camera, lesson, validation, fail-closed,
  no-raw-video-upload, typecheck, lint, and diff-check evidence. It also records
  a scoped stale audit-contract fix from `Submit attempt` to `Save practice`.
  Claim surfaces remained `not_trained` with no active labels, and no training,
  evaluator rerun, Brev lifecycle/spend, source/manifest/tensor/vocabulary
  mutation, export, promotion, browser recognition activation, Detector 0
  tracking authority, ASL correctness claim, final-readiness claim, or push
  occurred.
- M3FO completed prompt:
  [`docs/model/return-to-form-m3fo-final-fail-closed-demo-evidence-package-goal-loop-prompt.md`](return-to-form-m3fo-final-fail-closed-demo-evidence-package-goal-loop-prompt.md);
- M3FO executor commit `9502a76` completed one local/no-spend final evidence
  package slice and selected `stop_for_human_demo_acceptance_review`. The
  package:
  [`docs/validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json`](../validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json)
  consolidates the refreshed M3FN practice/camera/lesson/validation evidence,
  locked fail-closed claim surfaces, diagnostic-only model boundary, Brev
  default-off state, supported demo claims, unsupported recognition/model
  claims, commands run, forbidden actions not run, and next human choices.
- M3FO stop state: observer 589 parked the loop for human demo acceptance and
  inserted `<stop-orchestrator/>`. That stop has now been superseded by the
  M3FP human redirect below.
- M3FP completed prompt:
  [`docs/model/return-to-form-m3fp-overnight-brev-detector-tcn-completion-goal-loop-prompt.md`](return-to-form-m3fp-overnight-brev-detector-tcn-completion-goal-loop-prompt.md);
- M3FP executor commit `d8fcf7e` completed one bounded retained-worker PopSign
  Fresh5 motion-region-token TCN train/evaluate/copyback attempt and selected
  `continue_detector0_integration_for_crop_normalized_recognizer`. The receipt:
  [`docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json`](../validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json)
  records validation/test top-1 `0.2`, macro-F1 `0.06666666666666668`,
  collapse to `home`, four zero-recall labels on validation/test, failed
  promotion gates, stopped/default-off Brev state, no export/promotion/browser
  activation, and unchanged fail-closed claim surfaces.
- M3FQ completed prompt:
  [`docs/model/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-goal-loop-prompt.md`](return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-goal-loop-prompt.md);
- M3FQ executor commit `608d23f` ported the reviewed strict Detector 0
  contact/right-hand gate into a static main-branch contract and selected
  `continue_detector0_crop_normalized_local_smoke_no_brev`. The contract:
  [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
  records `manifest_validation_fp05_contact_gate`, contact threshold
  `0.20632459223270416`, a 5% validation-frame false-positive cap, learned
  right-hand crop use `0.06068840579710145`, isolated-smoke validation top-1
  `0.256`, test top-1 `0.3263157894736842`, no validation/test zero-recall
  labels, and explicit diagnostic-only/fail-closed claim boundaries.
- M3FR completed prompt:
  [`docs/model/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-goal-loop-prompt.md`](return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-goal-loop-prompt.md);
- M3FR executor commit `aa41147` created and ran one local/no-spend strict-gate
  crop-normalization smoke and selected
  `continue_detector0_strict_gate_metric_triage_no_brev`. The receipt:
  [`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](../validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json)
  records `0` validation packet-frame false positives at the M3FQ contract
  threshold, weak validation recall `0.14285714285714285`, F1 `0.25`, learned
  right-crop row rate `0.09090909090909091`, no saved model artifact, no
  generated detector tensor output, and unchanged fail-closed claim surfaces.
- M3FS active prompt:
  [`docs/model/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-goal-loop-prompt.md`](return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-goal-loop-prompt.md);
- M3FS executor commit `1313008` completed one local/no-spend/no-training
  Detector 0 strict-gate metric triage and selected
  `continue_openai_or_gpt_pro_research`. The receipt:
  [`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
  records no artifact/accounting issue, no strict-gate contract or threshold
  accounting bug, no local no-training repair, weak diagnostic transfer, narrow
  packet-frame support, target-schema limits, crop/input representation limits,
  and no browser/runtime authority.
- Observer 597 API research:
  [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
  recommends `redirect_to_fail_closed_product_polish_no_recognition`: improve
  or verify fail-closed browser/app/docs claim hygiene while keeping Detector 0
  evidence diagnostic only.
- M3FT active prompt:
  [`docs/model/return-to-form-m3ft-fail-closed-product-polish-no-recognition-goal-loop-prompt.md`](return-to-form-m3ft-fail-closed-product-polish-no-recognition-goal-loop-prompt.md);
- M3FT parked state: local/no-spend/no-training fail-closed product/claim
  hygiene remains a valid fallback if the user chooses submission polish, but
  it is not the active next executor slice after the latest human direction to
  keep investigating dataset/training viability.
- M3FU stopped prompt:
  [`docs/model/return-to-form-m3fu-dataset-training-root-cause-no-spend-goal-loop-prompt.md`](return-to-form-m3fu-dataset-training-root-cause-no-spend-goal-loop-prompt.md);
- M3FU executor commit `343d539` completed the local/no-spend/no-training
  dataset/training root-cause review and selected
  `stop_for_human_dataset_or_compute_strategy_review`. The receipt:
  [`docs/validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json`](../validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json)
  records `no_single_local_repair_found`: current evidence no longer points to
  one missing file, stale source-register hash, split leak, tensor path gap, or
  command-contract bug. Instead, PopSign label-ladder, ASL Citizen lesson,
  Fresh5 region-grid/TCN, and Detector 0 strict-gate evidence repeatedly show
  weak held-out transfer or prediction collapse while claim surfaces remain
  fail-closed. Further dataset, crop/input, architecture, training-budget,
  evaluator, or Brev work requires a human strategy choice before another
  autonomous slice.
- M3FV completed prompt:
  [`docs/model/return-to-form-m3fv-composable-ml-strategy-no-spend-goal-loop-prompt.md`](return-to-form-m3fv-composable-ml-strategy-no-spend-goal-loop-prompt.md);
- M3FV supervisor strategy resolution: continue ML investigation, but only by
  splitting the problem into composable, falsifiable subproblems before any GPU
  spend. The next executor must produce one concrete tracked artifact in a
  bounded route among source/label inventory, crop target schema,
  architecture/objective sanity, first-party annotation protocol, or a future
  compute receipt requiring human approval.
- M3FV executor result:
  [`docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json`](return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json)
  selected `architecture_objective_sanity` for ASL Citizen high-signal
  region-grid Tiny2 `table`/`hello`, with Tiny3 `black` only after Tiny2
  passes. It created the tracked M3FV receipt and selected
  `continue_architecture_objective_sanity_contract_no_spend`.
- M3FW active prompt:
  [`docs/model/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-goal-loop-prompt.md`](return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-goal-loop-prompt.md);
- M3FW observer handoff: implement the M3FV contract as one local/no-spend
  Tiny2 architecture/objective sanity proof or exact blocker. Keep Brev off,
  preserve fail-closed claim surfaces, and do not expand to Tiny3, Fresh5,
  25-label, 75-label, or 95-label work in the same slice.
- M3FW executor result:
  [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
  records that the fixed local architecture/objective fit the Tiny2 train split
  but failed the held-out noncollapse contract. Train accuracy was `1.0`,
  held-out top-1 was `0.75`, held-out macro-F1 was
  `0.7333333333333334`, held-out zero-recall labels were `[]`, and dominant
  predicted class share was `0.75`, above the `0.70` limit. The label-shuffle
  false-progress control did not suspiciously pass. It selected
  `continue_crop_or_input_schema_review_no_spend`.
- M3FX active prompt:
  [`docs/model/return-to-form-m3fx-crop-input-schema-review-no-spend-goal-loop-prompt.md`](return-to-form-m3fx-crop-input-schema-review-no-spend-goal-loop-prompt.md);
- M3FX observer handoff: create one local/no-spend/no-training crop/input
  schema review packet from existing evidence only. The next executor may
  compare candidate directions on paper, but must not implement crop/input
  changes, run training, rerun M3FW or Detector 0 smoke/evaluation, mutate
  source/manifest/tensor/vocabulary artifacts, run Brev, export, promote,
  activate browser recognition, or expand claims. If the review's selected next
  action would actually change architecture, input representation, source
  scope, training budget, compute, or claim surfaces, it must record the
  approval/escalation requirement instead of performing the change.
- M3FX executor result:
  [`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`](../validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json)
  compared fixed region-grid error analysis, union/contact-region schema
  review, full-frame or motion-context review, first-party/human-label protocol
  review, and a bounded compute proposal. It selected
  `continue_fixed_region_grid_error_analysis_no_spend` because existing M3FW
  per-example predictions, confidence values, signer/source records, and tensor
  paths can be analyzed without source, manifest, tensor, crop/input code,
  model, runtime, Brev, or claim-surface mutation.
- M3FY active prompt:
  [`docs/model/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-goal-loop-prompt.md`](return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-goal-loop-prompt.md);
- M3FY observer handoff: create one local/no-spend/no-training fixed
  region-grid error-analysis packet from existing M3FW/M3FX evidence only.
  The next executor may inspect existing prediction rows, confidence values,
  true/predicted labels, signer/source metadata, tensor paths, and fixed-region
  manifests, but must not rerun training/evaluation, generate tensors, mutate
  source/manifest/tensor/vocabulary artifacts, change crop/input code, run
  Brev, export, promote, activate browser recognition, or expand claims. If
  the analysis points to a schema, source, architecture, training-budget,
  compute, runtime, or claim-surface change, it must record the
  approval/escalation requirement instead of performing the change.
- M3FY executor result:
  [`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](../validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
  records a confident asymmetric fixed-grid error pattern: held-out `hello`
  recall was `1.0`, held-out `table` recall was `0.5`, and both `table` false
  negatives were high-confidence `hello` predictions from signers `P26` and
  `P39`. Correct `table` rows came from signers `P21` and `P12`; all held-out
  signers had correct `hello` rows. No repeated source-record or tensor-path
  cluster was visible, and all rows shared the same fixed region-grid shape.
  It selected `continue_fixed_region_grid_error_pattern_contract_no_spend`.
- M3FZ active prompt:
  [`docs/model/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-goal-loop-prompt.md`](return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-goal-loop-prompt.md);
- M3FZ observer handoff: create one local/no-spend/no-training fixed
  region-grid error-pattern contract from existing M3FW/M3FX/M3FY evidence
  only. The next executor may define candidate explanations, discriminating
  evidence fields, future no-mutation checks, and approval gates, but must not
  execute a model/proof/evaluator/smoke, inspect raw video, generate tensors or
  crops, mutate source/manifest/tensor/vocabulary artifacts, change crop/input
  code, run Brev, export, promote, activate browser recognition, or expand
  claims. If the contract points to schema, source, architecture,
  training-budget, compute, runtime, privacy, or claim-surface changes, it must
  record the approval/escalation requirement instead of performing the change.
- M3FZ executor result:
  [`docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json`](../validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json)
  records seven plausible explanations for the fixed-grid residual, approval
  gates, rejected immediate schema/input/source/compute actions, unchanged
  fail-closed claim surfaces, and no forbidden action. It selected
  `continue_fixed_region_grid_metadata_gap_receipt_no_spend` because existing
  receipts still lack the discriminating metadata needed to choose among
  signer, split/order, crop/coverage, temporal, model/objective, source/
  protocol, or compute routes.
- M3GA active prompt:
  [`docs/model/return-to-form-m3ga-fixed-region-grid-metadata-gap-receipt-no-spend-goal-loop-prompt.md`](return-to-form-m3ga-fixed-region-grid-metadata-gap-receipt-no-spend-goal-loop-prompt.md);
- M3GA observer handoff: create one local/no-spend/no-training fixed
  region-grid metadata-gap receipt from existing M3FW/M3FX/M3FY/M3FZ evidence
  only. The next executor may inventory existing receipt/manifest fields,
  classify missing field classes, and separate autonomous-safe checks from
  approval-gated checks, but must not run training/evaluation, rerun M3FW or
  Detector 0 smoke, inspect raw video, generate tensors/crops, mutate
  source/manifest/tensor/vocabulary artifacts, change crop/input code, run
  Brev, export, promote, activate browser recognition, or expand claims.
- M3GB active prompt:
  [`docs/model/return-to-form-m3gb-human-approved-bounded-brev-composable-training-goal-loop-prompt.md`](return-to-form-m3gb-human-approved-bounded-brev-composable-training-goal-loop-prompt.md);
- M3GB supervisor redirect: latest human instruction supersedes the queued
  M3GA no-spend metadata-gap paperwork and authorizes one bounded
  retained-worker Brev slice under oversight. M3GB should run exactly one
  ASL Citizen high-signal region-grid TCN training command after local audits,
  price/state verification, remote CUDA/process safety, sync, and dry-run. It
  must evaluate/copy back only if artifacts exist, stop the worker afterward,
  preserve fail-closed claim surfaces, and write a tracked receipt/session log.
  This is diagnostic training evidence only, not promotion or browser runtime
  authority.
- M3GB executor result:
  [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
  records one completed retained-worker CUDA training/evaluation/copyback
  slice. Validation top-1 was `0.37037037037037035`, validation macro-F1 was
  `0.33209647495361777`, test top-1 was `0.25`, test macro-F1 was
  `0.15634920634920638`, validation zero-recall labels were `black` and
  `table`, and test zero-recall labels were `black`, `please`, `table`, and
  `white`. The evaluator failed top-1, macro-F1, and negative-challenge gates,
  preserved fail-closed claim surfaces, stopped the retained worker, and
  selected `continue_m3gb_metric_triage_no_remote`.
- M3GC active prompt:
  [`docs/model/return-to-form-m3gc-m3gb-metric-triage-no-remote-goal-loop-prompt.md`](return-to-form-m3gc-m3gb-metric-triage-no-remote-goal-loop-prompt.md);
- M3GC observer handoff: create one local/no-remote/no-training metric-triage
  receipt from M3GB evidence. The next executor may inspect the tracked M3GB
  receipt/log and copied-back ignored output JSON files if present, but must
  not run Brev lifecycle/remote commands, rerun training/evaluation, export,
  promote, activate browser recognition, mutate product runtime, or expand
  claims.
- M3GC executor result:
  [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
  records that the completed M3GB run remains diagnostic-only and failed
  top-1, macro-F1, and negative-challenge gates. Validation zero-recall labels
  were `black` and `table`; test zero-recall labels were `black`, `please`,
  `table`, and `white`; threshold calibration could not rescue the run; and
  another remote run or compute receipt is premature before local per-example
  accounting. It selected `continue_m3gb_error_pattern_analysis_no_remote`.
- M3GD active prompt:
  [`docs/model/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-goal-loop-prompt.md`](return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-goal-loop-prompt.md);
- M3GD observer handoff: create one local/no-remote/no-training error-pattern
  analysis receipt from existing M3GC/M3GB evidence only. The next executor may
  inspect tracked M3GC/M3GB receipts/logs, existing high-signal region-grid
  manifests, and copied-back ignored M3GB output JSON files if present, but
  must not run Brev lifecycle/remote commands, rerun training/evaluation,
  inspect raw video, generate tensors/crops, export, promote, activate browser
  recognition, mutate product runtime, or expand claims.
- M3GD executor result:
  [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
  records that M3GB errors cluster by label, split, and some signer groups
  without proving a single root cause. `table` and `black` stayed zero-recall
  on validation and test; `please` and `white` fell to zero recall on test;
  validation errors overpredicted `uncle` and `hello`; test errors
  overpredicted `sad`; and source/split/signer metadata remains underpowered
  for attribution. It selected
  `continue_m3gb_source_split_or_metadata_contract_no_remote`.
- M3GE active prompt:
  [`docs/model/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-goal-loop-prompt.md`](return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-goal-loop-prompt.md);
- M3GE observer handoff: create one local/no-remote/no-training source/split/
  metadata contract from existing M3GD/M3GC/M3GB evidence only. The next
  executor may inspect tracked receipts/logs, existing high-signal region-grid
  manifests, and copied-back ignored output JSON files if present, but must not
  run Brev lifecycle/remote commands, rerun training/evaluation, inspect raw
  video, generate tensors/crops, mutate source/manifest/tensor/vocabulary
  artifacts, export, promote, activate browser recognition, or expand claims.
- M3GE executor result:
  [`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](../validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
  records that the existing M3GB validation/test sidecar joins cleanly to the
  high-signal region-grid manifests by `clip_id`, while sidecar/report outputs
  do not self-contain tensor paths, tensor hashes, full probability vectors,
  crop/region quality, motion descriptors, capture-condition metadata, or
  human label-quality fields. It classified sidecar tensor path/hash as a
  local accounting gap and selected
  `continue_m3gb_source_split_manifest_accounting_repair_no_remote`.
- M3GF active prompt:
  [`docs/model/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-goal-loop-prompt.md`](return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-goal-loop-prompt.md);
- M3GF observer handoff: create one local/no-remote/no-training source/split/
  manifest accounting repair from existing M3GE/M3GD/M3GC/M3GB evidence only.
  The next executor may join existing sidecar rows to existing validation/test
  manifests by `clip_id` and write a tracked accounting receipt/log, but must
  not run Brev lifecycle/remote commands, rerun training/evaluation, run an
  evaluator, inspect raw video, generate tensors/crops, mutate source/
  manifest/tensor/vocabulary artifacts, rewrite copied-back output sidecars or
  reports, export, promote, activate browser recognition, or expand claims.
- M3GF executor result:
  [`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`](../validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json)
  records that all 55 validation/test sidecar rows join to existing manifests
  by `clip_id`, with missing joins `0`, extra manifest rows `0`, duplicate
  clip/source-record keys `0`, and split/label/signer/source mismatches `0`.
  It kept claim surfaces fail-closed and selected
  `continue_m3gb_report_sidecar_contract_gap_patch_plan_no_remote`.
- M3GG active prompt:
  [`docs/model/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-goal-loop-prompt.md`](return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-goal-loop-prompt.md);
- M3GG observer handoff: create one local/no-remote/no-training report/sidecar
  contract-gap patch plan from existing M3GF/M3GE/M3GD/M3GC/M3GB evidence only.
  The next executor may inspect local evaluator/report contract surfaces for
  planning only, but must not run Brev lifecycle/remote commands, rerun
  training/evaluation, run an evaluator, edit evaluator/training code, inspect
  raw video, generate tensors/crops, mutate source/manifest/tensor/vocabulary
  artifacts, rewrite copied-back outputs, export, promote, activate browser
  recognition, or expand claims.
- M3GG executor result:
  [`docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json`](../validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json)
  inventories the current M3GB `validation-report.json` and
  `prediction-sidecar.json`, confirms copied-back output hashes, records that
  all 55 validation/test sidecar rows already join to existing manifests by
  `clip_id`, and identifies the smallest future repair as an evaluator-sidecar
  contract change centered on `scripts/evaluate_rawframe_model.py`. It kept
  Brev default-off, did not perform the repair or regenerate outputs, kept
  claim surfaces fail-closed, and selected
  `continue_m3gb_evaluator_sidecar_contract_repair_no_remote`.
- M3GH active prompt:
  [`docs/model/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-goal-loop-prompt.md`](return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-goal-loop-prompt.md);
- M3GH executor result:
  [`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`](../validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json)
  records the local/no-remote/no-training evaluator sidecar contract repair,
  including future `prediction-sidecar` v2 fields for stable row identity,
  manifest/tensor context, probability vectors, true-label probabilities, and
  report-to-sidecar references. Follow-up commit `cf9bf2c` fixed the
  negative-challenge tensor-path serialization gap found by observer nudge
  `c4b36cd`: future sidecar-facing `tensor_path` stays a JSON-safe string and
  `_tensor_path` is used only for internal tensor loading. M3GH did not run an
  evaluator, regenerate copied-back outputs, run Brev, train, export, promote,
  activate browser recognition, or expand claims. It selected
  `continue_m3gb_evaluator_output_regeneration_receipt_for_human_approval`.
- M3GI active prompt:
  [`docs/model/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-goal-loop-prompt.md`](return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-goal-loop-prompt.md);
- M3GI observer handoff: create one local/no-remote/no-training approval
  receipt for a future M3GB evaluator output regeneration/rerun. The next
  executor may inspect existing receipts/logs, copied-back ignored M3GB output
  JSON, manifests, and local command surfaces to write the proposed future
  command and verification plan, but must not run the evaluator, load a
  checkpoint for generated outputs, rewrite or regenerate copied-back outputs,
  copy back artifacts, run Brev lifecycle/remote commands, train, run
  browser/product smoke, inspect raw video, generate tensors/crops, mutate
  source/manifest/tensor/vocabulary artifacts, export, promote, activate
  browser recognition, change product runtime, or expand claims. If the
  receipt is complete, the expected next action is
  `stop_for_human_m3gb_evaluator_output_regeneration_approval`.
- M3GI executor/observer result:
  [`docs/validation/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-v1.json`](../validation/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-v1.json)
  records the future evaluator command, copied-back output hashes, fail-closed
  claim surfaces, and the fact that both local raw-frame sidecar analysis
  consumers still reject `prediction-sidecar` v2. Observer commit `36bd291`
  stopped the loop for human approval before any evaluator rerun, checkpoint
  output generation, or copied-output rewrite.
- M3GJ active prompt:
  [`docs/model/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-goal-loop-prompt.md`](return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-goal-loop-prompt.md);
- M3GJ supervisor redirect: the latest human instruction explicitly approves
  continuing the overnight completion push, unblocking bounded Brev usage under
  oversight, and using the project budget intentionally. The immediate next
  executor slice is still local-only: patch sidecar consumers to accept v1/v2,
  run the M3GI-approved evaluator regeneration exactly once, record regenerated
  sidecar/report contract status, and keep claim surfaces fail-closed. M3GJ may
  record the human approval for a later bounded Brev route, but must not run
  Brev lifecycle/remote commands, training/fitting, Detector 0 training,
  source import, export, promotion, browser activation, or claim expansion.
- M3GJ executor result:
  [`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`](../validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json)
  records conservative v1/v2 sidecar consumer compatibility, exactly one local
  evaluator regeneration against the copied-back M3GB checkpoint, JSON-valid
  regenerated v2 sidecar/report outputs, fail-closed claim surfaces, no remote
  work, and next action
  `continue_m3gk_bounded_brev_completion_route_after_regenerated_evidence`.
- M3GK active prompt:
  [`docs/model/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-goal-loop-prompt.md`](return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-goal-loop-prompt.md);
- M3GK observer handoff: run one bounded retained-worker Brev completion route
  only if local audits, M3GJ/M3GB evidence, claim surfaces, refreshed price,
  retained-worker identity, local dry-run/check-files, remote process/CUDA
  safety, sync/freshness hashes, and remote output-absence checks pass. The
  route may patch only the M3GK smoke output namespace guard in
  `scripts/train_rawframe_model.py`, then run exactly one timed independent-seed
  high-signal region-grid TCN command on `asl-pilot-m3eh-l40s-001` /
  `3d58wpy9o`, evaluate once if artifacts exist, copy back once if outputs
  exist, and stop/default-off verify. If any guard fails, record the blocker
  without starting or continuing Brev.
- M3GK executor/observer result:
  [`docs/validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json`](../validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json)
  records that local dry-run/check-files passed for all 139 high-signal
  region-grid clips and the retained L40S price remained under guard, but the
  required SSH/CUDA safety probe timed out before remote sync or training. The
  worker finally settled as `STOPPED` / `COMPLETED` / `NOT READY` /
  `UNHEALTHY`; no remote sync, training, evaluation, copyback, export,
  promotion, browser activation, or claim expansion occurred.
- M3GL active prompt:
  [`docs/model/return-to-form-m3gl-brev-provider-recovery-and-completion-route-goal-loop-prompt.md`](return-to-form-m3gl-brev-provider-recovery-and-completion-route-goal-loop-prompt.md);
- M3GL supervisor redirect: the latest human instruction supersedes the M3GK
  provider-review STOP for one bounded Brev provider recovery and completion
  route. M3GL must address the concrete unhealthy/SSH-timeout worker blocker:
  one retained-worker reset/recovery path first, then at most one replacement
  worker only if recovery fails and the refreshed listed price remains at or
  below `$5/hour`. M3GL may patch only the M3GL output-dir smoke guard,
  bootstrap the selected remote `.venv` from `requirements.txt` only if needed,
  run exactly one timed high-signal region-grid TCN training command, evaluate
  and copy back at most once if artifacts exist, and stop/default-off verify
  every worker it touches. If the evidence still does not justify promotion,
  the next route should be metric triage plus dataset/vocabulary/model-input
  strategy before any further training-style spend.
- M3GL result: M3GL created
  [`docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json`](../validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json)
  and session log
  [`docs/session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md`](../session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md).
  The retained worker recovered without reset/replacement, one timed CUDA
  training command and one evaluator command ran, copied-back diagnostic
  outputs were recorded, and final `brev ls --json` proof showed
  `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`. Metrics regressed versus
  M3GB/M3GJ: test top-1 `0.14285714285714285`, test macro-F1
  `0.09206349206349207`, and target gates failed. Claim surfaces stayed
  fail-closed.
- M3GM active prompt:
  [`docs/model/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-goal-loop-prompt.md`](return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-goal-loop-prompt.md);
- M3GM observer handoff: because M3GL completed the approved Brev slice but
  failed and regressed promotion metrics, the next route is local/no-remote/
  no-training metric triage plus dataset/vocabulary/model-input strategy from
  existing evidence. It may inspect tracked receipts/logs, strategy memos,
  source-register metadata, existing manifests, and copied-back ignored output
  JSON files if already present locally. It must not run Brev lifecycle or
  remote commands, training, evaluator reruns, source/media import, raw-video
  inspection, tensor/crop generation, source/manifest/tensor/vocabulary
  mutation, export, promotion, browser activation, final-gate change, or claim
  expansion.
- M3GM result: M3GM created
  [`docs/validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json`](../validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json)
  and session log
  [`docs/session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md`](../session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md).
  It classified M3GL as a regression versus M3GB/M3GJ under the same
  high-signal region-grid input contract, found unstable class-boundary/
  generalization evidence, kept Brev read-only/default-off, preserved
  fail-closed claim surfaces, and selected
  `continue_m3gn_dataset_vocab_model_input_contract_no_brev`.
- M3GN active prompt:
  [`docs/model/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-goal-loop-prompt.md);
- M3GN observer handoff: create one local/no-remote/no-training
  dataset/vocabulary/model-input contract from existing evidence only. The
  next executor may inspect M3GM/M3GL/M3GJ/M3GB receipts/logs, current strategy
  memos, source-register metadata, high-signal region-grid manifests, claim
  surfaces, and copied-back ignored output JSON files if present locally. It
  must not run Brev lifecycle or remote commands, training, evaluator reruns,
  source/media import, raw-video inspection, tensor/crop generation,
  source/manifest/tensor/vocabulary mutation, model/runtime code changes,
  export, promotion, browser activation, final-gate change, or claim expansion.
- M3GN result: M3GN created
  [`docs/validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json`](../validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json)
  and session log
  [`docs/session-logs/642-mission-3gn-dataset-vocab-model-input-contract-no-brev.md`](../session-logs/642-mission-3gn-dataset-vocab-model-input-contract-no-brev.md).
  It recorded the current 7-label ASL Citizen high-signal region-grid
  contract, ranked hypotheses around unstable class-boundary/generalization,
  threshold/calibration weakness, vocabulary composition, source/split limits,
  fixed-region coverage, temporal-motion signal, architecture/objective fit,
  and evaluation-contract gaps, separated autonomous-safe read-only fields
  from approval-gated checks, kept Brev default-off, preserved fail-closed
  claim surfaces, and selected
  `continue_m3go_read_only_contract_gap_inventory_no_brev`.
- M3GO active prompt:
  [`docs/model/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-goal-loop-prompt.md`](return-to-form-m3go-read-only-contract-gap-inventory-no-brev-goal-loop-prompt.md);
- M3GO observer handoff: create one local/no-remote/no-training read-only
  contract-gap inventory from existing M3GN/M3GM/M3GL/M3GJ/M3GB evidence and
  local accounting receipts only. The next executor may inspect existing
  tracked receipts/logs, current strategy memos, source-register metadata,
  high-signal region-grid manifests, claim surfaces, and copied-back ignored
  output JSON files if present locally. It must not run Brev lifecycle or
  remote commands, training, evaluator reruns, source/media import, raw-video
  inspection, tensor/crop generation, source/manifest/tensor/vocabulary
  mutation, model/runtime code changes, export, promotion, browser activation,
  final-gate change, or claim expansion.
- M3GO result: M3GO created
  [`docs/validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json`](../validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json)
  and session log
  [`docs/session-logs/644-mission-3go-read-only-contract-gap-inventory-no-brev.md`](../session-logs/644-mission-3go-read-only-contract-gap-inventory-no-brev.md).
  It mapped M3GN hypotheses to existing evidence, missing read-only fields,
  approval-gated checks, answered steering questions, and cheapest safe next
  evidence steps. It rejected another compute-only retry, product hardening
  before strategy packaging, and research API use inside M3GO, then selected
  `continue_m3gp_human_strategy_packet_no_brev`.
- M3GP active prompt:
  [`docs/model/return-to-form-m3gp-human-strategy-packet-no-brev-goal-loop-prompt.md`](return-to-form-m3gp-human-strategy-packet-no-brev-goal-loop-prompt.md);
- M3GP observer handoff: create one local/no-remote/no-training human strategy
  packet from existing M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB evidence and local
  accounting receipts only. The next executor may inspect existing
  receipts/logs, current strategy memos, source-register metadata,
  high-signal region-grid manifests, claim surfaces, and copied-back ignored
  output JSON files if present locally. It must not run Brev lifecycle or
  remote commands, training, evaluator reruns, research API calls, source/media
  import, raw-video inspection, tensor/crop generation, source/manifest/tensor/
  vocabulary mutation, model/runtime code changes, export, promotion, browser
  activation, final-gate change, or claim expansion.
- M3GP executor/observer result:
  [`docs/validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json`](../validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json)
  and session log
  [`docs/session-logs/646-mission-3gp-human-strategy-packet-no-brev.md`](../session-logs/646-mission-3gp-human-strategy-packet-no-brev.md)
  record a local/no-remote/no-training human strategy packet from the
  M3GL/M3GM/M3GN/M3GO evidence. It closed promotion, browser activation,
  another seed-only compute route, threshold rescue, and evaluator-contract
  repair as the primary blocker; left dataset/vocabulary/model-input,
  research, compute, product, source/media, and architecture/objective choices
  as human-gated; preserved fail-closed claim surfaces; kept Brev default-off;
  and selected `stop_for_human_dataset_vocab_model_input_strategy_choice`.
- M3GQ active prompt:
  [`docs/model/return-to-form-m3gq-source-vocab-input-repair-no-brev-goal-loop-prompt.md`](return-to-form-m3gq-source-vocab-input-repair-no-brev-goal-loop-prompt.md);
- M3GQ supervisor unpark: the latest supervising-user instruction asks to keep
  going and continue the work needed to make the datasets and training path
  function. This satisfies the M3GP human-choice gate for the conservative
  local lane only. The next executor may inspect existing approved local
  source/manifests/tensors/crops/input contracts and perform exactly one scoped
  local source/vocabulary/input repair that creates the next trainable
  contract. It must keep Brev default-off, avoid training/evaluator reruns, and
  preserve fail-closed claim surfaces.
- M3GQ result:
  [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
  and session log
  [`docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md`](../session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md)
  record a scoped reduced4 candidate contract from existing approved ASL
  Citizen high-signal region-grid rows only. The selected labels are `hello`,
  `uncle`, `white`, and `sad`; the parent seven-label contract stayed
  unchanged; tensor/hash coverage matched for all 79 reduced4 rows; the
  dry-run/check-files input-contract proof observed `rgb_regions_grid_v1` for
  all selected rows; no fitting, Brev lifecycle/remote work, evaluator rerun,
  export, promotion, browser activation, source import, or claim expansion
  occurred. M3GQ selected
  `continue_m3gr_local_dataloader_or_micro_overfit_preflight_no_brev`.
- M3GR active prompt:
  [`docs/model/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-goal-loop-prompt.md`](return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-goal-loop-prompt.md);
- M3GR observer handoff: prove or precisely block the reduced4 local
  dataloader/train-fit path before any Brev, export, promotion, browser
  activation, or claim work. The next executor may inspect M3GQ reduced4
  manifests, existing approved local tensor/input code, tiny-overfit helpers,
  claim surfaces, and prior receipts/logs. It must first prove the no-training
  dataloader/input contract. If that passes, it may run at most one bounded
  local tiny from-scratch micro-overfit train-fit sanity probe on a
  deterministic subset from the M3GQ reduced4 train split, with ignored
  outputs only and no promotion meaning.
- M3GR result:
  [`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](../validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json)
  and session log
  [`docs/session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md`](../session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md)
  record a successful local/no-Brev reduced4 dataloader and tiny train-fit
  preflight. The M3GQ reduced4 dry-run/check-files path observed
  `rgb_regions_grid_v1` for all 79 selected rows, the helper preserved the
  region axis through the model path, and exactly one local from-scratch
  micro-overfit on a deterministic four-clip subset reached same-subset
  accuracy `1.0` with zero-recall labels `[]`. This proves local input wiring
  and tiny train-fit only; it does not prove validation/test quality, product
  readiness, export eligibility, browser activation, final readiness, or broad
  training viability. M3GR selected
  `continue_m3gs_reduced4_trainability_result_triage_no_brev`.
- M3GS active prompt:
  [`docs/model/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-goal-loop-prompt.md`](return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-goal-loop-prompt.md);
- M3GS observer handoff: create one local/no-remote/no-Brev/no-training triage
  receipt that interprets the M3GR train-fit result without overclaiming it.
  The next executor may inspect M3GR/M3GQ receipts and logs, ignored M3GR
  output JSON if present locally, prior M3GP/M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB
  evidence, and claim surfaces. It must separate what M3GR proves from what it
  does not prove, evaluate bounded next options, and select exactly one next
  action without running training, evaluation, research, export, promotion,
  browser activation, source/media work, or claim changes.
- M3GS result:
  [`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`](../validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json)
  and session log
  [`docs/session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md`](../session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md)
  record a successful local/no-remote/no-Brev/no-training triage. M3GS
  separated what M3GR proves from what it does not prove, preserved
  fail-closed claim surfaces, kept Brev read-only/default-off, ran no
  training/fitting/evaluation, and selected
  `continue_m3gt_reduced4_local_training_smoke_receipt_no_brev`.
- M3GT active prompt:
  [`docs/model/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-goal-loop-prompt.md`](return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-goal-loop-prompt.md);
- M3GT observer handoff: create one local/no-remote/no-Brev/no-training
  receipt that specifies the future reduced4 local training-smoke command
  before any non-tiny fitting happens. The next executor may inspect M3GS,
  M3GR, and M3GQ evidence, already-present ignored M3GR output JSON, command
  surfaces, claim surfaces, and approved local artifact metadata. It must
  record command caps, output namespace guards, kill conditions, and planned
  interpretation rules without running training, evaluation, export,
  promotion, browser activation, source/media work, research, Brev lifecycle/
  remote work, or claim changes.
- M3GT result:
  [`docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json`](../validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json)
  and session log
  [`docs/session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md`](../session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md)
  record a successful local/no-remote/no-Brev/no-training receipt. M3GT found
  that the generic small-label smoke path is not acceptable because it does not
  preserve `rgb_regions` authority, recorded caps/guards/kill conditions for a
  future reduced4 local smoke, preserved fail-closed claim surfaces, kept Brev
  read-only/default-off, and selected
  `continue_m3gu_reduced4_local_training_smoke_no_brev`.
- M3GU active prompt:
  [`docs/model/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-goal-loop-prompt.md`](return-to-form-m3gu-reduced4-local-training-smoke-no-brev-goal-loop-prompt.md);
- M3GU observer handoff: first prove the reduced4-specific region-preserving
  train/eval guard. If the guard passes, run exactly one capped local/no-Brev
  diagnostic reduced4 smoke and at most one local diagnostic evaluation/report.
  If the guard cannot be satisfied with a small scoped change, do not fit; write
  the receipt and select no-training diagnosis, escalation, or human review.
- M3GU result:
  [`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](../validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
  and session log
  [`docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`](../session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md)
  record a successful guard-first local/no-Brev reduced4 diagnostic smoke.
  M3GU proved the route consumed `rgb_regions`, preserved the `B,T,R,C,H,W`
  region axis, avoided `rgb_frames` fallback, and used no pretrained
  components. It ran exactly one capped local training smoke and one local
  diagnostic evaluation/report. The report failed targets: validation top-1
  `0.26666666666666666`, validation macro-F1 `0.11111111111111112`, test top-1
  `0.25`, and test macro-F1 `0.1678321678321678`. There is no reduced4
  negative-challenge evidence. Claim surfaces stayed fail-closed, Brev stayed
  read-only/default-off, and M3GU selected
  `continue_m3gv_reduced4_smoke_metric_triage_no_brev`.
- M3GV active prompt:
  [`docs/model/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-goal-loop-prompt.md`](return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-goal-loop-prompt.md);
- M3GV observer handoff: create one local/no-remote/no-Brev/no-training metric
  triage receipt from existing M3GU evidence. The next executor may inspect
  existing receipts/logs, current strategy memos, M3GQ reduced4 manifests,
  fail-closed claim surfaces, and already-present ignored M3GU output JSON. It
  must interpret failed metrics, zero-recall labels, evaluator exit-status
  nuance, absent reduced4 negative-challenge evidence, and next options without
  training, evaluator reruns, implementation changes, Brev lifecycle/remote
  work, source/media work, export, promotion, browser activation, research API
  calls, final-gate changes, or claim expansion.
- M3GV result:
  [`docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json)
  and session log
  [`docs/session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md`](../session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md)
  record a local/no-remote/no-Brev/no-training triage of the M3GU reduced4
  smoke. M3GV separated guard/input proof from unproven readiness, interpreted
  validation/test zero-recall labels and prediction collapse, preserved
  fail-closed claim surfaces, kept Brev read-only/default-off, ran no training
  or evaluator rerun, and selected
  `continue_m3gw_reduced4_data_split_zero_recall_diagnosis_no_training`.
- M3GW active prompt:
  [`docs/model/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-goal-loop-prompt.md`](return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-goal-loop-prompt.md);
- M3GW observer handoff: create one local/no-remote/no-Brev/no-training
  diagnosis receipt from existing M3GV/M3GU/M3GQ evidence. The next executor may
  inspect reduced4 manifests, source-register metadata, fail-closed claim
  surfaces, and already-present ignored M3GU JSON to summarize split, source,
  signer, label, sidecar, and prediction-collapse evidence. It must record
  missing metadata fields as limitations and must not train, rerun evaluation,
  regenerate outputs, change implementation, mutate source/manifests/tensors/
  vocabulary, inspect raw media, run Brev lifecycle/remote commands, export,
  promote, activate browser recognition, call research APIs, change final
  gates, or expand claims.
- M3GW result:
  [`docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json`](../validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json)
  and session log
  [`docs/session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md`](../session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md)
  record a local/no-remote/no-Brev/no-training diagnosis of the M3GQ/M3GU
  reduced4 artifacts. M3GW found that visible label coverage/counts do not
  explain zero recall; source id is consistent; source-record and signer overlap
  across splits is empty; predictions collapsed to `sad`/`uncle`; `hello` and
  `white` were never predicted in validation/test; session/capture metadata is
  absent; and the sidecar lacks logits, embeddings, region/crop/frame-quality,
  and session diagnostics. It preserved fail-closed claim surfaces, kept Brev
  read-only/default-off, ran no training/evaluator rerun/regeneration, and
  selected
  `continue_m3gx_reduced4_manifest_metadata_or_sidecar_diagnostic_repair_no_training`.
- M3GX active prompt:
  [`docs/model/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-goal-loop-prompt.md`](return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-goal-loop-prompt.md);
- M3GX observer handoff: implement one smallest useful local/no-remote/no-Brev/
  no-training diagnostic-contract repair so the next reduced4 compute attempt is
  falsifiable. Prefer future sidecar/report instrumentation for logits or class
  probabilities, top-k scores, margin, entropy, manifest row linkage, and
  prediction-collapse summaries; otherwise add a manifest/session-metadata
  helper that records missing `session_id` / `source_session` fields and prevents
  overclaiming session drift. M3GX may edit diagnostic/evaluation/reporting code,
  helper scripts, tests, docs, a tracked receipt, and a numbered session log. It
  must not train, rerun evaluation, regenerate outputs, mutate source/manifests/
  tensors/vocabulary, inspect raw media, run Brev lifecycle/remote commands,
  export, promote, activate browser recognition, call research APIs, change final
  gates, broaden labels, or expand claims. This is the final no-training
  contract-repair slice before selecting a bounded no-training diagnostic eval
  rerun, strategy escalation, or human approval stop.
- M3GX result:
  [`docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json`](../validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json)
  and session log
  [`docs/session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md`](../session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md)
  record a future-facing evaluator sidecar repair. Future prediction sidecars
  can now include `logits_by_label`, predicted/true-label logits, top-2 logit,
  top-2 logit label, and logit margin for validation/test and negative-challenge
  rows. M3GX preserved fail-closed claim surfaces, kept Brev read-only/default-
  off, ran no training/evaluator rerun/regeneration, and selected
  `continue_m3gy_reduced4_diagnostic_eval_rerun_no_training_no_brev`.
- M3GY result:
  [`docs/validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json`](../validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json)
  and session log
  [`docs/session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md`](../session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md)
  record one bounded local/no-Brev/no-training diagnostic evaluator rerun under
  `output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/`. M3GY preserved M3GU
  outputs, kept claims fail-closed, and confirmed the M3GX raw-logit fields at
  the example level. The model still fails targets: validation top-1
  `0.26666666666666666`, validation macro-F1 `0.11111111111111112`, test top-1
  `0.25`, and test macro-F1 `0.1678321678321678`. Predictions collapse to
  `sad`/`uncle`; `hello` and `white` are not predicted in validation/test; logit
  margins are tiny and entropy is near the four-class maximum. One metadata gap
  remains: examples contain `top2_logit_label`, but
  `sidecar_contract.score_fields` omits it. M3GY selected
  `continue_m3gz_reduced4_logit_collapse_triage_no_training_no_brev`.
- M3GZ active prompt:
  [`docs/model/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-goal-loop-prompt.md`](return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-goal-loop-prompt.md);
- M3GZ observer handoff: run one local/no-remote/no-Brev/no-training triage of
  the M3GY report/sidecar and recent route. The next executor may inspect
  existing tracked receipts/logs/manifests/claim surfaces and already-present
  ignored M3GY output JSON read-only. It must interpret the weak-separation
  raw-logit evidence, record the `top2_logit_label` score-field metadata gap if
  still present, and choose strategy escalation, a small metadata patch, a
  concrete local diagnostic, or a human stop. It must not train, rerun
  evaluation, use Brev lifecycle/remote commands, mutate source/manifests/
  tensors/vocabulary, inspect raw media, export, promote, activate browser
  recognition, change final gates, or expand claims.
- M3GZ result:
  [`docs/validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json`](../validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json)
  and session log
  [`docs/session-logs/667-mission-3gz-reduced4-logit-collapse-triage-no-training-no-brev.md`](../session-logs/667-mission-3gz-reduced4-logit-collapse-triage-no-training-no-brev.md)
  record a no-training triage of the M3GY reduced4 diagnostic report/sidecar.
  M3GZ classified the result as weak near-uniform model/data/input strategy
  evidence, not an unobserved local sidecar/evaluator gap. Observer 668 saved a
  strategy escalation packet and stopped for human model-strategy review:
  [`docs/session-logs/668-observer-stop-m3gz-human-model-strategy-review.md`](../session-logs/668-observer-stop-m3gz-human-model-strategy-review.md).
- M3HA human review decision:
  [`docs/validation/return-to-form-m3ha-human-review-decision-v1.json`](../validation/return-to-form-m3ha-human-review-decision-v1.json)
  records the user-authorized human review from this thread. The review accepts
  the M3GZ stop conclusion for the deadline path: no further autonomous model/
  data/input/architecture/compute/source/promotion work is justified by the
  reduced4 evidence. Recognition remains fail-closed, and the active route
  redirects to deadline fail-closed product/demo finish work.
- M3HA supersession:
  [`docs/validation/return-to-form-m3hb-human-reopened-model-completion-route-v1.json`](../validation/return-to-form-m3hb-human-reopened-model-completion-route-v1.json)
  records the latest supervising-user correction: keep working toward the full
  product/model goal, unblock Brev usage, use compute intentionally, and
  backtrack/research when routes fail. M3HA's fail-closed-only route is now
  historical evidence, not the active route.
- M3HB result:
  commit `70c1b0e` completed the local contract patch and no-spend dry-run for
  the PopSign 25-label bounded route. It added the
  `output/m3hb-popsign25-bounded-brev-contract` training-smoke namespace,
  proved the exact PopSign25 local dry-run, kept Brev spend at `$0`, and
  selected `continue_m3hc_bounded_popsign_brev_training_or_eval`.
- M3HC result:
  commit `69d1dca` completed the approved bounded PopSign 25-label Brev
  training/evaluation attempt. It started the retained L40S worker, proved
  SSH/CUDA readiness, synced the repo and allowed rawframe data, ran one remote
  dry-run, one non-dry-run training command, one evaluator command, copied back
  one output directory, and verified final stop/default-off state. Metrics were
  weak and collapsed to `uncle`: validation top-1 `0.04`, validation macro-F1
  `0.003076923076923077`, test top-1 `0.04`, test macro-F1
  `0.003076923076923077`.
- M3HD result:
  commit `31bb785` completed the local/no-remote/no-Brev/no-training metric
  triage receipt from existing M3HC evidence. It confirmed that validation/test
  top-1 were exactly `0.04` chance, validation/test macro-F1 was
  `0.003076923076923077`, predictions collapsed completely to `uncle`, entropy
  stayed near `ln(25)`, and the result is negative diagnostic raw-frame
  evidence only. M3HD selected
  `continue_m3he_popsign25_data_split_label_or_sampler_diagnosis_no_training`.
- M3HE result:
  commit `fba887e` completed the local/no-remote/no-Brev/no-training PopSign 25
  split, label, class-index, true/predicted, sampler, and train/eval
  distribution diagnosis. It confirmed balanced manifests, internally
  consistent class-index evidence, all-`uncle` prediction over a normal `0.04`
  true `uncle` share, no metadata-visible cross-split path/signer duplication,
  and capped `64/625` training exposure. The capped exposure can explain weak
  near-uniform behavior, but the recorded accounting does not show a split,
  label, class-index, path-duplication, or sampler oversampling bug that fully
  explains the collapse. M3HE selected
  `continue_m3hf_popsign25_input_or_training_contract_preflight_no_remote`.
- M3HF result:
  commit `a367b08` completed the local/no-remote/no-Brev/no-training PopSign 25
  input, training-command, class-index, sampler, report, and sidecar contract
  preflight. It found no concrete input, command, class-index, sampler,
  threshold, tensor-rank, report, or sidecar gap that plausibly explains the
  all-`uncle` collapse. The strongest local limitation remains capped exposure:
  only `64/625` train examples were seen in M3HC. M3HF selected
  `continue_m3hg_bounded_popsign25_compute_receipt_no_training`.
- M3HG result:
  commit `31ef31f` completed the local/no-remote/no-Brev/no-training bounded
  PopSign 25 compute receipt from existing M3HF/M3HE/M3HD/M3HC evidence and
  read-only Brev inventory/search. It found the future compute envelope
  bounded, priced, and kill-conditioned, but not command-valid today because
  the current PopSign label-ladder training-smoke surface still caps training
  at `16` batches and does not allow a fresh M3HH output namespace. M3HG
  selected `continue_m3hh_popsign25_command_or_receipt_metadata_repair_no_training`.
- M3HH result:
  commit `a6ec363` completed the local/no-remote/no-Brev/no-training PopSign
  25 command-contract repair. It added the fresh
  `output/m3hh-popsign25-full-exposure-bounded-brev-contract` namespace,
  required that namespace to be absent before dry-run and fitting attempts,
  preserved legacy 16-batch caps for older namespaces, required the M3HH
  contract to use one epoch, batch size `4`, learning rate `0.001`,
  `--max-train-batches 157`, and `--max-validation-batches 157`, and recorded
  `data_loading_contract` metadata proving `625` train row visits with
  `drop_last=false`. M3HH selected
  `continue_m3hi_bounded_popsign25_compute_or_stop_with_provider_blocker`.
- M3HI active prompt:
  [`docs/model/return-to-form-m3hi-bounded-popsign25-compute-or-provider-blocker-goal-loop-prompt.md`](return-to-form-m3hi-bounded-popsign25-compute-or-provider-blocker-goal-loop-prompt.md);
- M3HI objective: run exactly one bounded PopSign 25 full-exposure Brev compute
  attempt under the M3HG envelope and M3HH command contract, or stop with a
  concrete provider/pre-start blocker before spend. The only authorized compute
  route is the retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, price
  guard under `2.00` USD/hour, hard spend cap `2.00` USD, max wall-clock from
  start to verified stop `60` minutes, one remote dry-run, one non-dry-run
  training command, one evaluator command, one copied output directory, and
  verified default-off teardown.
- M3HI post-start provider blocker and parked route:
  a supervised M3HI attempt started retained worker
  `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, but the single authorized sync step
  failed with `ssh: connect to host 160.211.47.117 port 22: Operation timed out`
  before remote dry-run, training, evaluator, or copyback. The worker was
  stopped and verified `STOPPED / COMPLETED / NOT READY / HEALTHY` at
  `2026-05-29T16:22:48Z`. The supervising user then redirected the active goal
  to Detector 0 training, accuracy, and spec fit. The M3HI prompt remains
  historical and reusable only after explicit human reauthorization.
- M3HJ result:
  [`docs/validation/return-to-form-m3hj-detector0-training-accuracy-spec-fit-v1.json`](../validation/return-to-form-m3hj-detector0-training-accuracy-spec-fit-v1.json)
  and
  [`docs/session-logs/686-mission-3hj-detector0-training-accuracy-spec-fit.md`](../session-logs/686-mission-3hj-detector0-training-accuracy-spec-fit.md).
  M3HJ completed the local/no-remote/no-Brev Detector 0 spec-fit audit at
  commit `d4021ec`. It found Detector 0 is not trained, not accurate, and not
  spec-fit today: detector card `status: "not_trained"`, promotion state
  `research_only`, null browser artifact, strict validation-frame recall
  `0.0575` at the 5% FPR threshold, and learned right-hand crop usage around
  `6.07%`. It selected
  `continue_m3hk_detector0_training_data_manifest_or_label_audit_no_brev`.
- M3HK result:
  [`docs/validation/return-to-form-m3hk-detector0-training-data-manifest-or-label-audit-no-brev-v1.json`](../validation/return-to-form-m3hk-detector0-training-data-manifest-or-label-audit-no-brev-v1.json)
  and
  [`docs/session-logs/688-mission-3hk-detector0-training-data-manifest-or-label-audit-no-brev.md`](../session-logs/688-mission-3hk-detector0-training-data-manifest-or-label-audit-no-brev.md).
  M3HK completed the local/no-remote/no-Brev Detector 0 data/label audit at
  commit `ee12807`. It found current tracked data and labels are not complete
  enough for a full scratch-trained Detector 0 training/evaluation route: the
  Tier 0 manifests cover 345 clips across five PopSign labels, but the approved
  Detector 0 packet has only 32 sparse frame rows; `right_or_second_hand` and
  `table_two_hand_union_or_contact_region` support is table-only; hard-negative,
  no-hand, empty-camera, low-light, temporal, IoU `0.30`/`0.50`, false no-hand,
  and browser-latency prerequisites are missing. It selected
  `continue_m3hl_detector0_manifest_or_label_contract_repair_no_brev`.
- M3HL result:
  [`docs/validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json`](../validation/return-to-form-m3hl-detector0-manifest-or-label-contract-repair-no-brev-v1.json)
  and
  [`docs/session-logs/690-mission-3hl-detector0-manifest-or-label-contract-repair-no-brev.md`](../session-logs/690-mission-3hl-detector0-manifest-or-label-contract-repair-no-brev.md).
  M3HL completed the local/no-remote/no-Brev Detector 0 manifest/label
  contract repair at commit `90197fe`. It wrote
  [`docs/model/return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json`](return-to-form-detector0-manifest-label-training-evaluation-contract-v1.json),
  preserved the current target schema, kept claim surfaces fail-closed, and
  selected `continue_m3hm_detector0_targeted_annotation_packet_plan_no_brev`.
- M3HM result:
  [`docs/validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json`](../validation/return-to-form-m3hm-detector0-targeted-annotation-packet-plan-no-brev-v1.json)
  and
  [`docs/session-logs/691-mission-3hm-detector0-targeted-annotation-packet-plan-no-brev.md`](../session-logs/691-mission-3hm-detector0-targeted-annotation-packet-plan-no-brev.md).
  M3HM completed the local/no-remote/no-Brev Detector 0 targeted annotation
  packet plan at commit `bf1fd82`. It wrote
  [`docs/model/return-to-form-detector0-targeted-annotation-packet-plan-v1.json`](return-to-form-detector0-targeted-annotation-packet-plan-v1.json),
  preserved the current target schema, kept claim surfaces fail-closed, and
  selected `continue_m3hn_detector0_targeted_annotation_packet_authoring_no_brev`.
- M3HN result:
  [`docs/validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json`](../validation/return-to-form-m3hn-detector0-targeted-annotation-packet-authoring-no-brev-v1.json)
  and
  [`docs/session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md`](../session-logs/693-mission-3hn-detector0-targeted-annotation-packet-authoring-no-brev.md).
  M3HN completed the local/no-remote/no-Brev Detector 0 targeted annotation
  packet authoring slice at commit `70e436d`. It wrote
  [`data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-v1.json),
  preserved the current target schema, kept negative-challenge rows as
  validation/test candidates only, kept claim surfaces fail-closed, and
  selected `continue_m3ho_detector0_annotation_packet_review_no_brev`.
- M3HO result:
  [`docs/validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json`](../validation/return-to-form-m3ho-detector0-annotation-packet-review-no-brev-v1.json)
  and
  [`docs/session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md`](../session-logs/695-mission-3ho-detector0-annotation-packet-review-no-brev.md).
  M3HO completed the local/no-remote/no-Brev/no-paid-compute Detector 0
  annotation packet review slice at commit `c8af07f`. It found the M3HN packet
  internally reviewable: all 32 V0 row references exist and are unique,
  target split counts match, promoted target IDs are preserved, and
  `table_two_hand_union_or_contact_region` remains auxiliary/table-scoped only.
  It also recorded that the packet is not training/evaluation,
  browser-promotion, final-gate, or claim-expansion ready. It selected
  `continue_m3hp_detector0_target_policy_review_no_brev`.
- M3HP result:
  [`docs/model/return-to-form-detector0-target-policy-review-v1.json`](return-to-form-detector0-target-policy-review-v1.json),
  [`docs/validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json`](../validation/return-to-form-m3hp-detector0-target-policy-review-no-brev-v1.json),
  and
  [`docs/session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md`](../session-logs/697-mission-3hp-detector0-target-policy-review-no-brev.md).
  M3HP completed the local/no-remote/no-Brev/no-paid-compute Detector 0
  target-policy review slice at commit `fa42c47`. It preserved current target
  IDs, classified current non-table `right_or_second_hand` absences as
  `true_absent`, constrained `upper_body_or_signing_space` as one coarse
  context target, kept `table_two_hand_union_or_contact_region`
  auxiliary/table-scoped only, canonicalized coordinate-space aliases, and
  selected `continue_m3hq_detector0_packet_overlay_materialization_no_brev`.
- M3HQ result:
  [`data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-overlays-v1.json),
  [`docs/validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json`](../validation/return-to-form-m3hq-detector0-packet-overlay-materialization-no-brev-v1.json),
  and
  [`docs/session-logs/699-mission-3hq-detector0-packet-overlay-materialization-no-brev.md`](../session-logs/699-mission-3hq-detector0-packet-overlay-materialization-no-brev.md).
  M3HQ completed the local/no-remote/no-Brev/no-paid-compute Detector 0 packet
  overlay materialization slice at commit `ca5e996`. It materialized 32 M3HN
  review-ready rows with source/license, provenance, no-pretrained, canonical
  coordinate-space, `absence_reason`, and `target_applicability` overlays;
  preserved current promoted target IDs; kept
  `table_two_hand_union_or_contact_region` auxiliary/table-scoped only; and
  selected `continue_m3hr_detector0_overlay_readiness_review_no_brev`.
- M3HR result:
  [`docs/model/return-to-form-detector0-overlay-readiness-review-v1.json`](return-to-form-detector0-overlay-readiness-review-v1.json),
  [`docs/validation/return-to-form-m3hr-detector0-overlay-readiness-review-no-brev-v1.json`](../validation/return-to-form-m3hr-detector0-overlay-readiness-review-no-brev-v1.json),
  and
  [`docs/session-logs/701-mission-3hr-detector0-overlay-readiness-review-no-brev.md`](../session-logs/701-mission-3hr-detector0-overlay-readiness-review-no-brev.md).
  M3HR completed the local/no-remote/no-Brev/no-paid-compute Detector 0
  overlay readiness review slice at commit `7bef572`. It found no
  overlay-repair gap for the current 32 M3HN rows, classified the overlay as
  internally complete for a future packet-expansion decision, kept fail-closed
  claim surfaces unchanged, and selected
  `continue_m3hs_detector0_targeted_annotation_packet_expand_no_brev`.
- M3HS result:
  [`data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json),
  [`docs/validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json`](../validation/return-to-form-m3hs-detector0-targeted-annotation-packet-expand-no-brev-v1.json),
  and
  [`docs/session-logs/703-mission-3hs-detector0-targeted-annotation-packet-expand-no-brev.md`](../session-logs/703-mission-3hs-detector0-targeted-annotation-packet-expand-no-brev.md).
  M3HS completed the local/no-remote/no-Brev/no-paid-compute Detector 0 packet
  expansion draft at commit `f43371a`. It preserved the current 32 packet and
  overlay rows by reference, added 18 source-bound table temporal-neighbor
  candidate rows, and selected
  `continue_m3ht_detector0_targeted_annotation_packet_expansion_review_no_brev`.
  The rows are pending manual target annotation and are not training,
  evaluation, browser-promotion, final-gate, or claim-expansion readiness.
- Supervisor bake-off gate:
  [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json).
  Supervisor commit `0379773` added current gate evidence: on the existing
  32-row packet, learned hands overfit and fail to beat the fixed-geometry
  baseline in 0 of 12 seeds. Subsequent Detector 0 work must learn both hands,
  keep face/body as fixed anchors, keep the table union diagnostic-only, and
  beat held-out fixed baselines left `0.4073` / right `0.6476` before any
  improvement, export, promotion, activation, or claim.
- M3HT result:
  [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json),
  [`docs/validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json`](../validation/return-to-form-m3ht-detector0-fixed-baseline-gate-contract-no-brev-v1.json),
  and
  [`docs/session-logs/704-mission-3ht-detector0-fixed-baseline-gate-contract-no-brev.md`](../session-logs/704-mission-3ht-detector0-fixed-baseline-gate-contract-no-brev.md).
  M3HT completed the local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 fixed-baseline gate contract slice at commit `38f8135`. It
  codified the fixed held-out hand baselines left `0.4073` / right `0.6476`,
  the learned-hands/fixed-face-body target design, diagnostic-only table target
  policy, M3HS pending-manual-annotation classification, and fail-closed claim
  boundaries, then selected
  `continue_m3hu_detector0_fixed_baseline_gate_contract_review_no_brev`.
- M3HU result:
  [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json),
  [`docs/validation/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-v1.json`](../validation/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-v1.json),
  and
  [`docs/session-logs/706-mission-3hu-detector0-fixed-baseline-gate-contract-review-no-brev.md`](../session-logs/706-mission-3hu-detector0-fixed-baseline-gate-contract-review-no-brev.md).
  M3HU completed the local/no-remote/no-Brev/no-paid-compute/no-training
  fixed-baseline gate contract review slice at commit `61a97dd`. It found the
  M3HT contract internally consistent and usable, verified the held-out hand
  thresholds left `0.4073` / right `0.6476`, preserved the learned-hands /
  fixed-face-body / diagnostic-table target design, classified M3HS expansion
  rows as pending manual annotation with zero verified new labels, kept source
  and hard-negative gaps separate, preserved fail-closed claim surfaces, and
  selected
  `continue_m3hv_detector0_manual_contact_sheet_overlay_packet_no_brev`.
- M3HV result:
  [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json),
  [`docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json`](../validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json),
  and
  [`docs/session-logs/708-mission-3hv-detector0-manual-contact-sheet-overlay-packet-no-brev.md`](../session-logs/708-mission-3hv-detector0-manual-contact-sheet-overlay-packet-no-brev.md).
  M3HV completed the local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 manual contact-sheet overlay packet slice at commit `d285c42`. It
  reviewed all 18 M3HS table temporal-neighbor candidate rows, authored manual
  hand boxes for 17 rows, recorded one `insufficient_visual_evidence` blocker
  for `det0-exp1-validation-table-000376-f004`, preserved fixed face/body
  anchors and diagnostic-only table union policy, kept fail-closed claim
  surfaces unchanged, and selected
  `continue_m3hw_detector0_manual_overlay_gap_repair_no_brev`.
- M3HW result:
  [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json),
  [`docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json`](../validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json),
  and
  [`docs/session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md`](../session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md).
  M3HW completed the local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 manual overlay gap-repair slice at commit `510222d`. It focused
  only on `det0-exp1-validation-table-000376-f004`, inspected retained
  contact-sheet, tensor, V0, and temporal-neighbor evidence, preserved the
  explicit `insufficient_visual_evidence` blocker, authored no supplemental
  hand labels, preserved fixed face/body anchors and diagnostic-only table
  union policy, kept fail-closed claim surfaces unchanged, and selected
  `continue_m3hx_detector0_manual_overlay_gap_review_no_brev`.
- M3HX result:
  [`tools/detector0-annotator/`](../../tools/detector0-annotator/),
  [`docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json`](../validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json),
  and
  [`docs/session-logs/713-mission-3hx-detector0-annotation-workbench-no-brev.md`](../session-logs/713-mission-3hx-detector0-annotation-workbench-no-brev.md).
  M3HX completed the local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 annotation workbench slice at commit `d18d528`. It created a
  local-only frame-prep and manual box-review workbench from existing approved
  tracked Tier 0 tensors/manifests, rendered an ignored smoke cache from 4
  frames, preserved fail-closed claim surfaces, wrote no authoritative labels,
  mutated no source/manifest/tensor/model-card/runtime/final-gate/claim
  surfaces, and selected
  `continue_m3hy_detector0_annotation_workbench_review_no_brev`.
- M3HY result:
  [`docs/model/return-to-form-detector0-annotation-workbench-review-v1.json`](return-to-form-detector0-annotation-workbench-review-v1.json),
  [`docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json`](../validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json),
  and
  [`docs/session-logs/715-mission-3hy-detector0-annotation-workbench-review-no-brev.md`](../session-logs/715-mission-3hy-detector0-annotation-workbench-review-no-brev.md).
  M3HY completed the local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 annotation workbench review slice at commit `461e6a2`. It found
  the M3HX workbench internally consistent and safe for a future local draft
  annotation workflow, kept exports draft-only, preserved fail-closed claim
  surfaces, wrote no authoritative labels, mutated no workbench/source/
  manifest/tensor/model-card/runtime/final-gate/claim surfaces, and selected
  `continue_m3hz_detector0_manual_label_ingestion_contract_no_brev`.
- M3HZ result:
  [`docs/model/return-to-form-detector0-manual-label-ingestion-contract-v1.json`](return-to-form-detector0-manual-label-ingestion-contract-v1.json),
  [`docs/validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json`](../validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json),
  and
  [`docs/session-logs/717-mission-3hz-detector0-manual-label-ingestion-contract-no-brev.md`](../session-logs/717-mission-3hz-detector0-manual-label-ingestion-contract-no-brev.md).
  M3HZ completed the local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 manual-label ingestion contract slice at commit `8f7f762`. It
  defined draft schema, row identity, split/label/clip/frame/tensor validation,
  coordinate bounds, target policy, source/license/provenance, human-review,
  absence semantics, conflict handling, forbidden inputs, fail-closed claim
  proof, and future artifact scope. It wrote no authoritative labels, ingested
  no drafts, mutated no packets/source/manifest/tensor/model-card/runtime/
  final-gate/claim surfaces, and selected
  `continue_m3ia_detector0_manual_draft_label_ingestion_no_brev`.
- M3IA active prompt:
  [`docs/model/return-to-form-m3ia-detector0-manual-draft-label-ingestion-no-brev-goal-loop-prompt.md`](return-to-form-m3ia-detector0-manual-draft-label-ingestion-no-brev-goal-loop-prompt.md);
- M3IA objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 manual draft-label ingestion slice. M3IA must apply the M3HZ
  contract to local workbench draft exports if reviewed exports exist, and
  either create one non-empty authoritative supplemental ingestion artifact or
  record the exact blocker that prevents ingestion. It must not create a
  zero-row authoritative artifact, author labels by hand, fabricate review
  metadata, mutate existing label packets, source manifests, source register,
  tensors, vocabulary, model cards, runtime code, final gates, claim surfaces,
  or side-worktree files.
- M3IB direct repair result:
  [`data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json),
  [`docs/validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json`](../validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json),
  and
  [`scripts/ingest_detector0_reviewed_manual_overlays.mjs`](../../scripts/ingest_detector0_reviewed_manual_overlays.mjs).
  The direct user repair stopped the stale repeated STOP loop and materialized
  the existing tracked M3HV reviewed manual overlay packet into one
  supplemental ingestion artifact. It promotes 17 reviewed manual hand rows,
  preserves one `blocked_insufficient_visual_evidence` row, keeps fail-closed
  claim surfaces unchanged, and remains not training/evaluation,
  browser-promotion, final-gate, or claim-expansion ready by itself. It selects
  `continue_m3ic_detector0_combined_packet_training_contract_no_brev`.
- M3IC prompt:
  [`docs/model/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-goal-loop-prompt.md);
- M3IC objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-promotion
  Detector 0 combined-packet training contract slice. It must reference the 32
  V0 rows and the 17 M3IB supplemental rows, preserve the blocked row, record
  combined split/label/source/target counts and remaining evaluation gaps, keep
  the fixed-baseline beat-it gate, and avoid training, Brev lifecycle,
  source/media import, export, promotion, browser activation, final-gate
  changes, or claim expansion.
- M3IC result:
  [`docs/model/return-to-form-detector0-combined-packet-training-contract-v1.json`](return-to-form-detector0-combined-packet-training-contract-v1.json),
  [`docs/validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json`](../validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json),
  and
  [`docs/session-logs/780-mission-3ic-detector0-combined-packet-training-contract-no-brev.md`](../session-logs/780-mission-3ic-detector0-combined-packet-training-contract-no-brev.md).
  M3IC completed at commit `fc9a1c5`. It wrote the combined-packet contract for
  49 included future training/evaluation rows, preserved one blocked
  insufficient-visual-evidence supplemental row as excluded, kept the
  hand/fixed-anchor/diagnostic-only target policy, kept the fixed-baseline
  beat-it gate and fail-closed claim surfaces, ran no training or Brev
  lifecycle command, and selected
  `continue_m3id_detector0_combined_packet_materialization_no_brev`.
- M3ID prompt:
  [`docs/model/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-goal-loop-prompt.md`](return-to-form-m3id-detector0-combined-packet-materialization-no-brev-goal-loop-prompt.md);
- M3ID objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 combined-packet materialization slice. It must materialize the
  M3IC contract into one combined packet artifact with exactly 49 included rows
  and one excluded blocked row, preserve source split and identity fields,
  preserve target policy and fixed-baseline gate, keep claim surfaces
  fail-closed, and avoid training, Brev lifecycle, source/media import, tensor
  mutation, export, promotion, browser activation, final-gate changes, or claim
  expansion.
- M3ID result:
  [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json),
  [`docs/validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json`](../validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json),
  and
  [`docs/session-logs/782-mission-3id-detector0-combined-packet-materialization-no-brev.md`](../session-logs/782-mission-3id-detector0-combined-packet-materialization-no-brev.md).
  M3ID completed at commit `7911466`. It materialized the combined packet with
  49 included rows and one excluded blocked row, preserved target policy and
  fixed-baseline beat-it gate, kept claim surfaces fail-closed, ran no training
  or Brev lifecycle command, and selected
  `continue_m3ie_detector0_evaluation_gap_contract_no_brev`.
- M3IE prompt:
  [`docs/model/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-goal-loop-prompt.md);
- M3IE objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 evaluation-gap contract slice. It must turn the M3ID combined
  packet and known blockers into one auditable contract covering hard-negative/
  no-hand, empty-camera, low-light, temporal-jitter, recall, false no-hand,
  false-trigger, browser-latency, and fixed-baseline beat-it evidence gaps,
  while preserving target policy, fail-closed claims, and no-training/no-Brev
  boundaries.
- M3IE result:
  [`docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json`](return-to-form-detector0-evaluation-gap-contract-v1.json),
  [`docs/validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json`](../validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json),
  and
  [`docs/session-logs/784-mission-3ie-detector0-evaluation-gap-contract-no-brev.md`](../session-logs/784-mission-3ie-detector0-evaluation-gap-contract-no-brev.md).
  M3IE completed at commit `0a9a90f`. It recorded the required Detector 0
  evaluation gaps, kept all readiness surfaces blocked, preserved the
  fixed-baseline beat-it gate and fail-closed claim surfaces, ran no training
  or Brev lifecycle command, and selected
  `continue_m3if_detector0_hard_negative_source_review_no_brev`.
- M3IF prompt:
  [`docs/model/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-goal-loop-prompt.md`](return-to-form-m3if-detector0-hard-negative-source-review-no-brev-goal-loop-prompt.md);
- M3IF objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 hard-negative/no-hand source review slice. It must use tracked
  local evidence and the source register to determine whether approved sources
  or local fixtures can support future hard-negative/no-hand evidence, without
  importing media, creating rows, authoring labels, running training, or
  changing claims.
- M3IF result:
  [`docs/model/return-to-form-detector0-hard-negative-source-review-v1.json`](return-to-form-detector0-hard-negative-source-review-v1.json),
  [`docs/validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json`](../validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json),
  and
  [`docs/session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md`](../session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md).
  M3IF completed at commit `d48f35b`. It classified approved validation-only
  negative challenge sources and local fixtures as available for a future
  manifest contract, kept training-ready hard-negative rows absent, preserved
  fail-closed claim surfaces, ran no training or Brev lifecycle command, and
  selected `continue_m3ig_detector0_hard_negative_manifest_contract_no_brev`.
- M3IG prompt:
  [`docs/model/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-goal-loop-prompt.md);
- M3IG objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 hard-negative/no-hand manifest contract slice. It must define the
  future validation-only hard-negative manifest contract from tracked evidence,
  preserving validation-only/training boundaries and fail-closed claims while
  avoiding media import, row creation, label authoring, training, Brev, export,
  promotion, or claim expansion.
- M3IG result:
  [`docs/model/return-to-form-detector0-hard-negative-manifest-contract-v1.json`](return-to-form-detector0-hard-negative-manifest-contract-v1.json),
  [`docs/validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json`](../validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json),
  and
  [`docs/session-logs/788-mission-3ig-detector0-hard-negative-manifest-contract-no-brev.md`](../session-logs/788-mission-3ig-detector0-hard-negative-manifest-contract-no-brev.md).
  M3IG completed at commit `7a57280`. It defined the validation-only
  hard-negative/no-hand manifest contract, kept external sources
  validation-only and not training-ready, preserved fail-closed claim surfaces,
  ran no training or Brev lifecycle command, and selected
  `continue_m3ih_detector0_hard_negative_manifest_materialization_no_brev`.
- M3IH prompt:
  [`docs/model/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-goal-loop-prompt.md`](return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-goal-loop-prompt.md);
- M3IH objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 hard-negative/no-hand manifest materialization slice. It must
  materialize the M3IG validation-only manifest path from tracked negative
  challenge fixture evidence, set every external row `allowed_for_training: false`,
  preserve source/provenance/category/duplicate/no-pretrained proofs,
  keep first-party training-capable hard-negative rows absent, keep claim
  surfaces fail-closed, and avoid training, Brev lifecycle, source/media import,
  new source authority, label authoring, export, promotion, browser activation,
  final-gate changes, or claim expansion.
- M3IH result:
  [`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`](../../data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json),
  [`docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json`](../validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json),
  and
  [`docs/session-logs/790-mission-3ih-detector0-hard-negative-manifest-materialization-no-brev.md`](../session-logs/790-mission-3ih-detector0-hard-negative-manifest-materialization-no-brev.md).
  M3IH completed at commit `b0687c3`. It materialized 25 validation-only
  hard-negative/no-hand rows, 5 per approved category, kept every external row
  `allowed_for_training: false`, preserved fail-closed claim surfaces, ran no
  training or Brev lifecycle command, and selected
  `continue_m3ii_detector0_negative_evaluation_metric_contract_no_brev`.
- M3II prompt:
  [`docs/model/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-goal-loop-prompt.md);
- M3II objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 negative-evaluation metric contract slice. It must define future
  evaluator input schema, positive false-no-hand metrics, strict no-hand
  negative false-trigger metrics, `non_target_asl_sign` context handling, and
  pass/fail gate semantics from tracked evidence while avoiding evaluation
  runs, training, Brev lifecycle, source/media import, new source authority,
  label authoring, export, promotion, browser activation, final-gate changes,
  or claim expansion.
- M3II result:
  [`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`](return-to-form-detector0-negative-evaluation-metric-contract-v1.json),
  [`docs/validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json`](../validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json),
  and
  [`docs/session-logs/792-mission-3ii-detector0-negative-evaluation-metric-contract-no-brev.md`](../session-logs/792-mission-3ii-detector0-negative-evaluation-metric-contract-no-brev.md).
  M3II completed at commit `4610c97`. It defined future prediction artifact
  schema and metric semantics for 49 positive rows, 20 strict no-hand negative
  rows, and 5 `non_target_asl_sign` context rows, kept claim surfaces
  fail-closed, ran no evaluation/training or Brev lifecycle command, and
  selected `continue_m3ij_detector0_negative_evaluation_harness_no_brev`.
- M3IJ active prompt:
  [`docs/model/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-goal-loop-prompt.md`](return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-goal-loop-prompt.md);
- M3IJ objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 negative-evaluation harness slice. It may implement the smallest
  local harness and synthetic harness smoke needed to validate future scratch
  Detector 0 prediction artifacts against the M3II metric contract, while
  avoiding real evaluation, trained-detector invocation, training, Brev
  lifecycle, source/media import, new source authority, label authoring,
  export, promotion, browser activation, final-gate changes, or claim
  expansion.
- M3IJ result:
  [`scripts/evaluate_detector0_negative_metrics.mjs`](../../scripts/evaluate_detector0_negative_metrics.mjs),
  [`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json`](../validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json),
  and
  [`docs/session-logs/794-mission-3ij-detector0-negative-evaluation-harness-no-brev.md`](../session-logs/794-mission-3ij-detector0-negative-evaluation-harness-no-brev.md).
  M3IJ completed at commit `ce9a2f5`. It added a local negative-evaluation
  harness, ran only synthetic harness smoke, kept the smoke labeled as harness
  validation rather than model performance, preserved fail-closed claim
  surfaces, ran no real evaluation/training or Brev lifecycle command, and
  selected
  `continue_m3ik_detector0_first_party_negative_capture_contract_no_brev`.
- M3IK active prompt:
  [`docs/model/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-goal-loop-prompt.md);
- M3IK objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 first-party negative capture contract slice. It must define the
  consent, provenance, privacy, absence-label, split, no-pretrained,
  no-generated-label, and review requirements for future first-party
  training-capable hard-negative/no-hand rows while keeping those future rows
  separate from the existing M3IH validation-only negatives. It must avoid raw
  learner video capture/upload, source/media import, row or label authoring,
  training, Brev lifecycle, evaluation, export, promotion, browser activation,
  final-gate changes, or claim expansion.
- M3IK result:
  [`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`](return-to-form-detector0-first-party-negative-capture-contract-v1.json),
  [`docs/validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json`](../validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json),
  and
  [`docs/session-logs/796-mission-3ik-detector0-first-party-negative-capture-contract-no-brev.md`](../session-logs/796-mission-3ik-detector0-first-party-negative-capture-contract-no-brev.md).
  M3IK completed at commit `371da4d`. It defined future first-party consented
  training-capable hard-negative/no-hand requirements, kept those future rows
  separate from existing M3IH validation-only negatives, preserved fail-closed
  claim surfaces, ran no raw learner video capture/upload, training, real
  evaluation, or Brev lifecycle command, and selected
  `continue_m3il_detector0_first_party_negative_capture_packet_plan_no_brev`.
- M3IL active prompt:
  [`docs/model/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-goal-loop-prompt.md`](return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-goal-loop-prompt.md);
- M3IL objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 first-party negative capture packet-plan slice. It must turn the
  M3IK contract into future planned slot/count/provenance/review requirements
  without creating authoritative rows, raw media, labels, tensors, source
  authority, model artifacts, or claim changes. It must avoid raw learner video
  capture/upload, source/media import, training, Brev lifecycle, real
  evaluation, export, promotion, browser activation, final-gate changes, or
  claim expansion.
- M3IL result:
  [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json),
  [`docs/validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json`](../validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json),
  and
  [`docs/session-logs/798-mission-3il-detector0-first-party-negative-capture-packet-plan-no-brev.md`](../session-logs/798-mission-3il-detector0-first-party-negative-capture-packet-plan-no-brev.md).
  M3IL completed at commit `0c5a995`. It planned 20 future first-party
  negative slots, all `planned_not_captured`, with 12 train, 4 validation, and
  4 test slots, zero authoritative rows, zero raw media, zero labels or
  tensors, preserved fail-closed claim surfaces, ran no capture/training/real
  evaluation or Brev lifecycle command, and selected
  `continue_m3im_detector0_first_party_negative_capture_packet_review_no_brev`.
- M3IM active prompt:
  [`docs/model/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-goal-loop-prompt.md`](return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-goal-loop-prompt.md);
- M3IM objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 first-party negative capture packet-review slice. It must review
  the M3IL packet plan against the M3IK contract and current privacy,
  no-pretrained, validation-only separation, and fail-closed claim boundaries
  before any capture or row materialization can be considered. It must avoid
  raw learner video capture/upload, source/media import, row/label authoring,
  training, Brev lifecycle, real evaluation, export, promotion, browser
  activation, final-gate changes, or claim expansion.
- M3IM result:
  [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json),
  [`docs/validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json`](../validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json),
  and
  [`docs/session-logs/800-mission-3im-detector0-first-party-negative-capture-packet-review-no-brev.md`](../session-logs/800-mission-3im-detector0-first-party-negative-capture-packet-review-no-brev.md).
  M3IM completed at commit `cb5f56e`. It accepted M3IL only as a future-only
  packet plan, verified 20 `planned_not_captured` slots, 12 train / 4
  validation / 4 test split counts, 0 future-only null-field violations, no
  actual raw media references, zero authoritative rows, zero labels or tensors,
  M3IH validation-only separation, and fail-closed claim surfaces. It ran no
  capture, training, real evaluation, or Brev lifecycle command and selected
  `continue_m3in_detector0_training_readiness_gap_contract_no_brev`.
- M3IN active prompt:
  [`docs/model/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-goal-loop-prompt.md);
- M3IN objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 training-readiness gap contract slice. It must reconcile current
  readiness blockers across positive rows, validation-only negatives,
  future-only first-party negative slots, metric/harness integration,
  fixed-baseline beat-it gates, and fail-closed claim surfaces before any
  training, real evaluation, Brev spend, export, promotion, browser activation,
  final-gate change, or claim expansion can be considered.
- M3IN result:
  [`docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json`](return-to-form-detector0-training-readiness-gap-contract-v1.json),
  [`docs/validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json`](../validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json),
  and
  [`docs/session-logs/802-mission-3in-detector0-training-readiness-gap-contract-no-brev.md`](../session-logs/802-mission-3in-detector0-training-readiness-gap-contract-no-brev.md).
  M3IN completed at commit `2aeff74`. It recorded that the current Detector 0
  packet is not training-ready: 49 positive rows exist but are not sufficient,
  25 M3IH negatives remain validation-only, 20 M3IL/M3IM first-party negative
  slots remain future-only with zero authoritative rows/raw clips/labels/
  tensors, M3II/M3IJ still lack materialized first-party negatives and a
  trained prediction artifact in real evaluation, the fixed-baseline beat-it
  gate remains unmet, and claim surfaces remain fail-closed. It ran no capture,
  row creation, label authoring, tensor mutation, training, real evaluation, or
  Brev lifecycle command and selected
  `continue_m3io_detector0_training_packet_gap_closure_plan_no_brev`.
- M3IO active prompt:
  [`docs/model/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-goal-loop-prompt.md`](return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-goal-loop-prompt.md);
- M3IO objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 training-packet gap closure plan slice. It must map the M3IN
  blockers to concrete next artifacts, evidence requirements, dependencies,
  and forbidden shortcuts before any future capture, row materialization,
  training packet merge, metric/harness update, real evaluation, Brev spend,
  export, promotion, browser activation, final-gate change, or claim expansion
  can be considered.
- M3IO result:
  [`docs/model/return-to-form-detector0-training-packet-gap-closure-plan-v1.json`](return-to-form-detector0-training-packet-gap-closure-plan-v1.json),
  [`docs/validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json`](../validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json),
  and
  [`docs/session-logs/804-mission-3io-detector0-training-packet-gap-closure-plan-no-brev.md`](../session-logs/804-mission-3io-detector0-training-packet-gap-closure-plan-no-brev.md).
  M3IO completed at commit `bd855ad`. It mapped current Detector 0 blockers to
  next required artifacts and evidence dependencies, including explicit human
  capture approval, consent/capture receipt, first-party negative packet,
  validation-only separation review, metric/harness coverage contract,
  fixed-baseline beat-it evaluation, claim review, and future Brev compute
  authorization if remote training is ever requested. It ran no capture, row
  creation, label authoring, tensor mutation, harness mutation, training, real
  evaluation, or Brev lifecycle command and selected
  `continue_m3ip_detector0_first_party_capture_authorization_request_no_brev`.
- M3IP active prompt:
  [`docs/model/return-to-form-m3ip-detector0-first-party-negative-capture-authorization-request-no-brev-goal-loop-prompt.md`](return-to-form-m3ip-detector0-first-party-negative-capture-authorization-request-no-brev-goal-loop-prompt.md);
- M3IP objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-capture/
  no-training Detector 0 first-party negative capture authorization-request
  slice. It must prepare a bounded human approval request for the planned
  first-party no-hand negative capture packet while clearly recording that the
  request is not approval. It must avoid capture, media import, row creation,
  label authoring, tensor generation, harness mutation, training, real
  evaluation, Brev lifecycle, export, promotion, browser activation,
  final-gate change, or claim expansion.
- M3IP result:
  [`docs/model/return-to-form-detector0-first-party-negative-capture-authorization-request-v1.json`](return-to-form-detector0-first-party-negative-capture-authorization-request-v1.json),
  [`docs/validation/return-to-form-m3ip-detector0-first-party-negative-capture-authorization-request-no-brev-v1.json`](../validation/return-to-form-m3ip-detector0-first-party-negative-capture-authorization-request-no-brev-v1.json),
  and
  [`docs/session-logs/806-mission-3ip-detector0-first-party-negative-capture-authorization-request-no-brev.md`](../session-logs/806-mission-3ip-detector0-first-party-negative-capture-authorization-request-no-brev.md).
  M3IP completed at commit `0bdf71a`. It prepared the bounded yes/no human
  approval request for exactly 20 future first-party no-hand negative capture
  slots, split 12 train / 4 validation / 4 test, recorded that explicit human
  approval is absent, preserved validation-only separation for M3IH negatives,
  kept claim surfaces fail-closed, ran no capture, media import, row creation,
  label authoring, tensor mutation, harness mutation, training, real
  evaluation, Brev lifecycle command, export, promotion, browser activation,
  final-gate change, or claim expansion, and selected
  `stop_for_human_first_party_negative_capture_approval`.
- M3IQ active prompt:
  [`docs/model/return-to-form-m3iq-detector0-landmark-integration-offline-policy-goal-loop-prompt.md`](return-to-form-m3iq-detector0-landmark-integration-offline-policy-goal-loop-prompt.md);
- M3IQ objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion Detector 0 integration/governance slice under the
  human-authorized offline-label policy. It may record the policy decision,
  define the 4-region + 21-hand-landmark target contract, update the fail-closed
  Detector 0 card provenance, or plan the recognizer phase.
- M3IQ result:
  [`DECISIONS.md`](../../DECISIONS.md),
  [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json),
  and
  [`docs/session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md`](../session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md).
  M3IQ completed at commit `4bebde5`. It recorded the policy decision that
  offline-derived labels, including MediaPipe-derived labels, may be used only
  as training/evaluation supervision when the deployed runtime remains this
  project's scratch-trained model, preserved runtime/deps/browser bans, cited
  supervisor side-worktree evidence by exact path and hash, kept claim surfaces
  fail-closed, ran no labeling, training, Brev lifecycle, export, promotion, or
  browser activation, and selected
  `continue_m3ir_detector0_landmark_contract_or_card_integration`.
- M3IR active prompt:
  [`docs/model/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-goal-loop-prompt.md`](return-to-form-m3ir-detector0-landmark-contract-or-card-integration-goal-loop-prompt.md);
- M3IR objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion Detector 0 project-integration slice: either define
  or update the 4-region + 21-hand-landmark target contract, or update the
  fail-closed Detector 0 card provenance/notes while preserving research-only
  status and browser artifact null.
- M3IR result:
  [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json),
  [`docs/validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json`](../validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json),
  and
  [`docs/session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md`](../session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md).
  M3IR completed at commit `8c5da16`. It defined the static Detector 0 target
  contract for four coarse regions plus 21 hand landmarks per hand, preserved
  M3IQ offline-label provenance wording, kept claim surfaces fail-closed, ran
  no labeling, training, evaluation, Brev lifecycle, export, promotion, browser
  activation, or side-worktree mutation, and selected
  `continue_m3is_detector0_landmark_contract_or_card_followup`.
- M3IS active prompt:
  [`docs/model/return-to-form-m3is-detector0-landmark-contract-card-followup-goal-loop-prompt.md`](return-to-form-m3is-detector0-landmark-contract-card-followup-goal-loop-prompt.md);
- M3IS objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion followup integrating the M3IR target contract with
  fail-closed Detector 0 card and claim governance: update
  `web/public/model/detector0-card.json` provenance/notes while preserving
  fail-closed status, or prove via a narrow receipt that no card mutation is
  needed.
- M3IS result:
  [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json),
  [`docs/validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json`](../validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json),
  and
  [`docs/session-logs/813-mission-3is-detector0-card-contract-policy-followup.md`](../session-logs/813-mission-3is-detector0-card-contract-policy-followup.md).
  M3IS completed at commit `200ce1d`. It updated the fail-closed Detector 0
  card with M3IR target-contract and M3IQ offline-label provenance, preserved
  `status: "not_trained"`, `promotion_state: "research_only"`, browser artifact
  null, empty active labels, disabled runtime gates, no pretrained components,
  no labeling/training/evaluation/Brev lifecycle/export/promotion/browser
  activation, and selected `continue_m3it_recognizer_landmark_sequence_plan`.
- M3IT active prompt:
  [`docs/model/return-to-form-m3it-recognizer-landmark-sequence-plan-goal-loop-prompt.md`](return-to-form-m3it-recognizer-landmark-sequence-plan-goal-loop-prompt.md);
- M3IT objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion static planning slice for a future scratch-trained
  recognizer that consumes the M3IR region + hand-landmark target sequence. It
  must create a scoped plan/contract artifact and receipt, not runtime code,
  tensors, training, export, promotion, browser activation, or claims.
- M3IT result:
  [`docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`](return-to-form-recognizer-landmark-sequence-plan-v1.json),
  [`docs/validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json`](../validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json),
  and
  [`docs/session-logs/815-mission-3it-recognizer-landmark-sequence-plan.md`](../session-logs/815-mission-3it-recognizer-landmark-sequence-plan.md).
  M3IT completed at commit `c401e4e`. It defined the future recognizer input
  sequence shape, coordinate/masking rules, temporal window assumptions,
  provenance requirements, validation prerequisites, and fail-closed claim
  boundaries, kept all claim surfaces fail-closed, ran no labeling, training,
  evaluation, Brev lifecycle, export, promotion, browser activation, tensor
  generation, or runtime implementation, and selected
  `continue_m3iu_detector0_landmark_training_packet_readiness_plan`.
- M3IU active prompt:
  [`docs/model/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-goal-loop-prompt.md`](return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-goal-loop-prompt.md);
- M3IU objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion readiness-plan slice for a future Detector 0 region
  + hand-landmark training packet. It must map packet-readiness evidence,
  missing authority, runtime/deps separation, validation prerequisites, and
  claim boundaries before any source import, labeling, tensor generation,
  training, evaluation, export, promotion, browser activation, final-gate
  change, or claim expansion.
- M3IU result:
  [`docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json`](return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json),
  [`docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json`](../validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json),
  and
  [`docs/session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md`](../session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md).
  M3IU completed at commit `a1a4325`. It recorded source rights,
  derived-label authority, raw clip/frame references, sidecar provenance,
  coordinate compatibility, split/leakage proof, checksum coverage,
  human-review samples, and negative/no-hand accounting as missing or
  not-ready, kept claim surfaces fail-closed, ran no source import, labeling,
  training, evaluation, Brev lifecycle, export, promotion, browser activation,
  tensor generation, or runtime implementation, and selected
  `continue_m3iv_detector0_landmark_training_packet_authority_gap_review`.
- M3IV active prompt:
  [`docs/model/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-goal-loop-prompt.md`](return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-goal-loop-prompt.md);
- M3IV objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion authority-gap review for a future Detector 0 region
  + hand-landmark training packet. It must classify current source-register
  and derived-label authority gaps before any source import, source approval,
  MediaPipe labeling, packet materialization, tensor generation, training,
  evaluation, Brev spend, export, promotion, browser activation, final-gate
  change, or claim expansion.
- M3IV result:
  [`docs/model/return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json`](return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json),
  [`docs/validation/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-v1.json`](../validation/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-v1.json),
  and
  [`docs/session-logs/819-mission-3iv-detector0-landmark-training-packet-authority-gap-review.md`](../session-logs/819-mission-3iv-detector0-landmark-training-packet-authority-gap-review.md).
  M3IV completed at commit `36257cb`. It recorded that no current
  source-register record explicitly authorizes offline-derived Detector 0
  region boxes plus 21-hand-landmark labels for a materialized training or
  evaluation packet; first-party browser capture remains candidate-only until
  packet-specific consent and derived-label scope are present; ASL Citizen,
  WLASL, and PopSign records remain raw-video-only for this authority question;
  validation-only negative sources remain insufficient; and any future approved
  packet must disclose: "targets offline-derived via MediaPipe Holistic;
  runtime uses only our scratch-trained model and is not a runtime dependency."
  It kept claim surfaces fail-closed, ran no source import, labeling, packet
  materialization, tensor generation, training, evaluation, Brev lifecycle,
  export, promotion, browser activation, final-gate change, or claim expansion,
  and selected `stop_for_human_source_or_label_authority_review`.
- M3IV supervisor resolution:
  [`docs/session-logs/822-supervisor-resolve-m3iv-source-label-authority.md`](../session-logs/822-supervisor-resolve-m3iv-source-label-authority.md).
  Supervisor commit `1a96a12` resolved the M3IV source-label-authority stop by
  amending `docs/model/dataset-source-register.json` so PopSign
  offline-derived region/landmark/pose labels are permitted as
  training/evaluation supervision under CC BY 4.0, while preserving the
  scratch-runtime and no-pretrained-browser boundaries. It removed the
  `<stop-orchestrator/>` sentinel and instructed the loop not to re-STOP on the
  old source-label authority issue.
- M3IW active prompt:
  [`docs/model/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-no-brev-goal-loop-prompt.md);
- M3IW objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion materialization-contract slice for a future
  Detector 0 region + hand-landmark training packet. It must define eligible
  source scope, packet input requirements, offline-label sidecar/provenance
  requirements, coordinate compatibility, split/leakage constraints,
  review/negative/no-hand accounting, validation prerequisites, and
  fail-closed claim boundaries before any source import, labeling, packet
  materialization, tensor generation, training, evaluation, Brev spend, export,
  promotion, browser activation, final-gate change, recognizer work, or claim
  expansion.
- M3IW result:
  [`docs/model/return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json`](return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json),
  [`docs/validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json`](../validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json),
  and
  [`docs/session-logs/824-mission-3iw-detector0-landmark-training-packet-materialization-contract.md`](../session-logs/824-mission-3iw-detector0-landmark-training-packet-materialization-contract.md).
  M3IW completed at commit `df9e5e9`. It recorded PopSign v1 original videos
  as the only currently eligible source for a future packet after manifest
  proof, kept first-party capture candidate-only, preserved fail-closed claim
  surfaces, ran no source import, labeling, packet materialization, tensor
  generation, training, evaluation, Brev lifecycle, export, promotion, browser
  activation, final-gate change, or claim expansion, and selected
  `continue_m3ix_detector0_landmark_packet_source_manifest_contract_no_brev`.
- M3IX active prompt:
  [`docs/model/return-to-form-m3ix-detector0-landmark-packet-source-manifest-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3ix-detector0-landmark-packet-source-manifest-contract-no-brev-goal-loop-prompt.md);
- M3IX objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion source-manifest contract slice for a future
  Detector 0 region + hand-landmark training packet. It must define eligible
  source scope, source-manifest row schema, split/leakage proof,
  signer/clip/frame reference requirements, checksum and attribution
  requirements, privacy/provenance constraints, validation prerequisites, and
  fail-closed claim boundaries before any source import, raw-media copying,
  manifest materialization, labeling, packet materialization, tensor
  generation, training, evaluation, Brev spend, export, promotion, browser
  activation, final-gate change, recognizer work, or claim expansion.
- M3IX result:
  [`docs/model/return-to-form-detector0-landmark-packet-source-manifest-contract-v1.json`](return-to-form-detector0-landmark-packet-source-manifest-contract-v1.json),
  [`docs/validation/return-to-form-m3ix-detector0-landmark-packet-source-manifest-contract-v1.json`](../validation/return-to-form-m3ix-detector0-landmark-packet-source-manifest-contract-v1.json),
  and
  [`docs/session-logs/826-mission-3ix-detector0-landmark-packet-source-manifest-contract.md`](../session-logs/826-mission-3ix-detector0-landmark-packet-source-manifest-contract.md).
  M3IX completed at commit `dce5c84`. It recorded PopSign v1 original videos
  plus the offline-derived-label amendment as the only currently eligible
  source scope for a future source manifest after manifest proof; defined the
  future source-manifest row schema, split/leakage proof, checksum,
  attribution, provenance/privacy, and validation-prerequisite contract; kept
  all claim surfaces fail-closed; ran no source import, raw-media copying,
  source-register mutation, source-manifest materialization, labeling, packet
  materialization, tensor generation, training, evaluation, Brev lifecycle,
  export, promotion, browser activation, final-gate change, or claim
  expansion; and selected
  `continue_m3iy_detector0_landmark_label_sidecar_contract_no_brev`.
- M3IY active prompt:
  [`docs/model/return-to-form-m3iy-detector0-landmark-label-sidecar-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3iy-detector0-landmark-label-sidecar-contract-no-brev-goal-loop-prompt.md);
- M3IY objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
  no-training/no-promotion label-sidecar contract slice for a future Detector 0
  region + hand-landmark training packet. It must define offline-derived label
  run metadata, source-row and frame binding, target-schema compatibility,
  coordinate frame, per-frame label fields, quality/confidence/visibility,
  manual-review states, provenance/privacy constraints, validation
  prerequisites, and fail-closed claim boundaries before any labeler run,
  sidecar materialization, source-manifest materialization, packet
  materialization, tensor generation, training, evaluation, Brev spend, export,
  promotion, browser activation, final-gate change, recognizer work, or claim
  expansion.

Historical M3HZ prompt:
  [`docs/model/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-goal-loop-prompt.md`](return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-goal-loop-prompt.md);
- M3HZ objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 manual-label ingestion contract slice. M3HZ must define the
  validation, provenance, human-review, conflict, absence,
  target-applicability, and forbidden-input contract a later ingestion slice
  must satisfy before local workbench draft exports can become authoritative
  Detector 0 label artifacts. It may create one scoped contract artifact, one
  validation receipt, and one numbered session log, but it must not ingest
  draft labels, write new authoritative label rows, mutate existing packets,
  source manifests, source register, tensors, vocabulary, model cards, runtime
  code, final gates, claim surfaces, or side-worktree files.

Historical M3HU prompt:
  [`docs/model/return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-goal-loop-prompt.md`](return-to-form-m3hu-detector0-fixed-baseline-gate-contract-review-no-brev-goal-loop-prompt.md);
- M3HU objective:
  complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
  Detector 0 fixed-baseline gate contract review slice. M3HU must review the
  M3HT contract, receipt, and log against the supervisor bake-off receipt, M3HS
  expansion evidence, packet/overlay/source evidence, and fail-closed claim
  surfaces before any further Detector 0 manual annotation, source/hard-negative
  review, training, export, promotion, or claim work. It may create one
  contract-review artifact, one validation receipt, and one numbered session
  log, but it must not mutate the M3HT contract, M3HQ overlay, M3HN packet
  draft, existing approved packet, source manifests, source register, labels,
  tensors, vocabulary, model cards, runtime code, final gates, claim surfaces,
  or side-worktree files.

Historical M3HB prompt:
  [`docs/model/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-goal-loop-prompt.md`](return-to-form-m3hb-human-reopened-model-completion-bounded-brev-goal-loop-prompt.md);
- M3HB objective: choose exactly one concrete route from current evidence and
  make one reviewable move toward the requested interactive scratch-trained
  product. Preferred routes are PopSign 25/50-label bounded Brev contract,
  Detector 0 crop-normalized recognizer contract, a specific high-signal TCN
  contract repair, interactive fail-closed product hardening if ML is blocked,
  or research escalation when no route has a testable hypothesis.
- Human landmark-annotation clarification: approved landmark-annotated data is
  allowed as offline supervision. Use human-authored or explicitly
  source-approved landmarks, boxes, masks, or region labels for scratch-trained
  Detector 0/crop/landmark-target work when rights/provenance are recorded.
  This does not allow pretrained landmark/detector runtimes, pretrained feature
  caches, or per-source rights shortcuts in the promoted/browser lane.

Historical M3HA prompt:
  [`docs/model/return-to-form-m3ha-human-reviewed-fail-closed-demo-finish-goal-loop-prompt.md`](return-to-form-m3ha-human-reviewed-fail-closed-demo-finish-goal-loop-prompt.md);
- M3HA objective was: complete exactly one local/no-spend/no-training fail-closed
  deadline demo slice. The executor may run product/status audits, typecheck/
  lint if available, and fix at most one bounded product or claim-hygiene
  blocker. It must preserve `model-card.status=not_trained`,
  `detector0-card.status=not_trained`, and `activeLabels=[]`.

### Current Hard Limits

- Mission 3IY is active after M3IX completed the static packet source-manifest
  contract. The loop may define a static label-sidecar contract only; it must
  not import sources, copy raw media, materialize source manifests, materialize
  label sidecars, materialize packets, run labeling, generate labels or
  tensors, train/evaluate, use Brev beyond read-only inventory, export,
  promote, activate browser recognition, change final gates, or expand claims.
- M3IY must not start, stop, reset, sync, exec, or copy from Brev. Read-only
  `brev ls --json` is allowed only to prove no unexpected paid work is running.
- M3IY must not run MediaPipe, import MediaPipe into the loop branch, re-run the
  supervisor side-worktree labeling/training/evaluation/export pipeline, mutate
  side-worktree files, import source/media authority, approve sources, author
  labels, generate labels, materialize source manifests, materialize label
  sidecars, materialize packets, create tensors/checkpoints/ONNX/browser
  bundles, implement recognizer or Detector 0 runtime code, promote, activate
  browser recognition, alter final gates, or expand claims.
- Offline-derived labels are allowed only as disclosed training/evaluation
  supervision when the deployed runtime remains this project's scratch-trained
  model. Offline labelers are never runtime dependencies.
- There is no active route for raw learner video upload, unreviewed source or
  media import, source-approval shortcut, generated labels, pretrained
  shortcuts, duplicate paid worker creation, replacement worker creation,
  unbounded sweeps, final-gate weakening, browser recognition activation,
  model-card promotion, Detector 0 runtime authority, or recognition
  claim-expansion. Approved human/source-provided landmark, box, mask, or
  region annotations are not a pretrained shortcut when used only as offline
  supervision for scratch-trained project models.
- Treat the fixed-crop proof as diagnostic evidence now; Detector 0 may be the
  active composable crop-normalization lane, but it must stay scratch-trained
  and no-pretrained.
- Do not import or approve new datasets without source-register evidence.
- Do not use pretrained detectors, landmarks, feature extractors, backbones, or
  model weights in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness from the
  controlled clip-heldout checkpoint.
- Brev must remain default-off during M3IY. During the M3HK observer handoff,
  live `brev ls --json` briefly reported the retained worker as `RUNNING /
  READY / HEALTHY`; the observer verified no training process, ran
  `brev stop asl-pilot-m3eh-l40s-001`, and re-verified `STOPPED / COMPLETED /
  NOT READY / HEALTHY` before committing the M3HL handoff. M3IY carries no
  approval for any Brev lifecycle or remote command.
