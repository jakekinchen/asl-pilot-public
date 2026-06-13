# Return-To-Form Tier 0 Detector 0 Table Second-Hand Packet Expansion Design V1

Mission: M3AE-X Detector 0 table second-hand packet expansion design.
Generated: 2026-05-26T01:57:50Z.
Status: `design_complete`.

## Purpose

M3AE-W classified the remaining `table` `right_or_second_hand` failure as
`packet_positive_support_scarcity`. This design defines one bounded path for a
future candidate-packet review using only approved Tier 0 PopSign manifest
rows. It does not mutate the Detector 0 packet, approve boxes, train Detector
0, train the recognizer, rerun the crop-normalization ablation, import or
approve sources, use Brev compute, export ONNX, promote a model card, weaken
final gates, or claim readiness.

## Source Artifacts

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-W remediation receipt | `docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json` | `ab42d0f02b037fafde3e5299d513a4b671b685e83bf1d9654d23cd89f2a6783a` |
| M3AE-V policy-aware receipt | `docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json` | `fdf665aa6d223b60cbe9804f47f2b0b8619b6a8c7273bd79ba5696fee45af304` |
| M3AE-U optional-target policy | `docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md` | `565a34fa0029345b64d9f1ac485d2c474a79f33fd4a5bec786ac8e69fe99b4a8` |
| M3AE-T target remediation | `docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json` | `4ca5fbd2a10acb0d8d817370e6778466d989a61b6c939b1f87f1066eb6091f28` |
| M3AE-S ablation smoke | `docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json` | `b3c86cc08a82bdbe8ca212c26f8bc0287514ca559ad7beac0f9f41c8e21b20a7` |
| M3AE-Q ablation design | `docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md` | `5658eec611b40459ff6473dad1338a718572c40cb297a6f704563f8f657d1316` |
| M3AE-P Detector 0 smoke | `docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json` | `ba8871964ba24bae88935bcad24c132af90dcd8d607bef04df54f56ebdd3b611` |
| M3AE-L Detector 0 bootstrap | `docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json` | `bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5` |
| Detector 0 packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34` |
| Source register | `docs/model/dataset-source-register.json` | `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8` |
| Source coverage | `docs/research/return-to-form-tier0-source-coverage.json` | `1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378` |
| Fixed-crop config | `docs/model/return-to-form-fixed-crop-config.json` | `dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29` |
| Pre-training gates | `docs/validation/return-to-form-tier0-gates.json` | `2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97` |
| Decode/dataloader receipt | `docs/validation/return-to-form-tier0-decode-dataloader.json` | `d64c0b46500075d94207ef2197a6f6d8f1570cf548da8b08ca16dc520ba386c2` |
| Tensor contract receipt | `docs/validation/return-to-form-tier0-tensor-contract.json` | `0f2ea12cf9a6517bafb67876ba4b0e4951ce821b61b27a740d45f6d1e36b3cd3` |
| Train manifest | `data/manifests/return-to-form-tier0/train.json` | `03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de` |
| Validation manifest | `data/manifests/return-to-form-tier0/validation.json` | `23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808` |
| Test manifest | `data/manifests/return-to-form-tier0/test.json` | `b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed` |

Selected labels: `please`, `table`, `dad`, `grandpa`, `hat`.

## Current Baseline

The current Detector 0 packet has three reviewed `table`
`right_or_second_hand` positive rows, one per split:

| Split | Row | Review status | Box | Confidence |
| --- | --- | --- | --- | ---: |
| train | `det0-v0-train-table-000376-f010` | `manual_corrected` | `[0.34, 0.58, 0.86, 0.82]` | 0.62 |
| validation | `det0-v0-validation-table-000376-f005` | `manual_verified` | `[0.44, 0.46, 0.80, 0.66]` | 0.58 |
| test | `det0-v0-test-table-000286-f005` | `manual_verified` | `[0.44, 0.47, 0.80, 0.68]` | 0.55 |

The M3AE-V policy-aware baseline remains unchanged:

```text
table_manifest_examples=69
table_expected_present_decisions=1104
missed_present_table_right_or_second_hand_count=928
missed_present_table_right_or_second_hand_rate=0.8405797101449275
gateable_per_target_fallback_rate_max=0.60
policy_aware_gate_status=failed
```

Available approved `table` manifest surface:

| Split | Table clips | Unique signer hashes | Current positive rows |
| --- | ---: | ---: | ---: |
| train | 25 | 16 | 1 |
| validation | 25 | 8 | 1 |
| test | 19 | 6 | 1 |

## Candidate Selection Criteria

A future candidate packet may include only rows that satisfy all of these
criteria:

1. The source clip appears in one of the committed Tier 0 manifests:
   `data/manifests/return-to-form-tier0/train.json`,
   `data/manifests/return-to-form-tier0/validation.json`, or
   `data/manifests/return-to-form-tier0/test.json`.
2. `label_id` is exactly `table`, `source_id` is
   `popsign-v1-original-videos`, and `allowed_for_model_training` is `true`.
3. The row uses the existing manifest-bound tensor path and hashes. Candidate
   review reads `rgb_regions` and the `full_frame_reference` region; it does
   not decode untracked media or import new media.
4. The candidate frame visibly contains both hands during the table sign,
   preferably near the contact or brushing portion rather than a pre-sign or
   post-sign rest pose.
5. The right/second hand is not fully hidden, outside frame, or so blurred that
   a reviewer cannot place a bounded full-frame `xyxy` box.
6. The chosen frame has enough upper-body context to verify hand identity
   against the retained fixed-crop regions and, when useful, the retained table
   contact sheet at
   `docs/validation/return-to-form-tier0-remediation-contact-sheets/table.png`.
7. The candidate is not one of the three current packet rows unless it is used
   only as a non-mutating anchor/reference in the candidate-review artifact.
8. Candidate diversity is preferred: choose different source records and signer
   hashes before taking repeated clips from the same signer, especially in
   validation and test where signer counts are smaller.

Candidate rows are not approved annotations. They are review inputs only until
a later explicit packet-review slice classifies each row as
`manual_verified`, `manual_corrected`, or rejected.

## Split-Balance Target

Current support is one positive row per split. The next candidate packet should
be large enough to survive some rejections while still staying reviewable.

| Split | Current positives | Candidate-review target | Minimum accepted target after review |
| --- | ---: | ---: | ---: |
| train | 1 | up to 6 new candidate rows | at least 5 total positives |
| validation | 1 | up to 6 new candidate rows | at least 5 total positives |
| test | 1 | up to 6 new candidate rows | at least 5 total positives |

The candidate-review target is a maximum of 18 new candidate rows. The minimum
accepted target is four additional accepted rows per split, leaving at least
five reviewed `table` `right_or_second_hand` positives per split before any
Detector 0 retraining or ablation rerun is considered.

If a future review cannot find at least four additional acceptable candidate
rows in any split from the current approved manifests, that review should stop
and select `detector0_table_second_hand_source_frame_triage` rather than
mutating the packet or relaxing source rules.

## Manual Review Workflow

A future candidate-packet review should:

1. Produce a tracked candidate-review artifact before mutating the packet.
2. For each candidate, record split, clip id, source record id, source video
   hash, signer identity hash, frame index, timestamp, tensor path, tensor file
   hash, tensor digest hash, and source register hash.
3. Render or inspect only existing tensor-derived `full_frame_reference` frames
   and retained contact-sheet evidence. Temporary overlays may be used locally
   but should not be treated as new source evidence.
4. Draw full-frame normalized `xyxy` boxes for both hands only after visual
   inspection. For the `right_or_second_hand` box, require a visible second
   hand region with a plausible center, nonzero area, and coordinates clamped
   to `[0, 1]`.
5. Assign `manual_verified` only when the candidate's initial box is accepted
   without coordinate changes. Assign `manual_corrected` when the reviewer
   changes a candidate box. Reject the row when visibility is insufficient,
   hand identity is ambiguous, both hands cannot be distinguished, the frame is
   too dark or blurred, the second hand is outside the frame, or provenance
   fields cannot be hash-bound to the manifest.
6. Preserve optional-target policy semantics from M3AE-U: reviewed absent
   optional targets are report-only, but expected-present `table`
   `right_or_second_hand` misses remain gate-affecting.
7. Keep M3AE-V's `928/1104` missed-present baseline as the comparison point
   for any later Detector 0 retraining or policy-aware ablation rerun.

## Future Packet Mutation Rules

No packet mutation occurs in this design slice. If a later review selects
packet mutation, it must be a separate committed slice with:

- the pre-mutation packet hash and post-mutation packet hash;
- a stable row id for every new row;
- all existing packet rows preserved unless a separate review explicitly
  rejects or replaces a row;
- source id, source record id, source video hash, signer identity hash, tensor
  path, tensor file hash, tensor digest hash, frame index, timestamp, reviewer,
  reviewed timestamp, review status, target boxes, confidence, occlusion flag,
  truncation flag, and notes for every added row;
- no inferred boxes from a pretrained detector, landmark model, pose model,
  generated pseudo-label source, or unapproved media.

## Boundaries

| Boundary | Status |
| --- | --- |
| Design-only artifact | satisfied |
| Detector 0 packet mutation | not performed |
| Approved box annotation | not performed |
| Candidate rows treated as approved annotations | false |
| Detector 0 training | not performed |
| Recognizer training | not performed |
| Crop-normalization ablation rerun | not performed |
| Label expansion | not performed |
| Controlled clip-heldout evaluation | not performed |
| Source approval or media import | not performed |
| Product runtime code change | not performed |
| Pretrained detector, landmark, backbone, embedding, or pseudo-label source | not used |
| Brev sync, SSH, training, stop, or compute | not performed |
| Brev status check | `brev ls --json` only |
| Existing Brev worker | `asl-pilot-rawframe-001` remains running and healthy |
| Manual Brev stop command | `brev stop asl-pilot-rawframe-001` |
| Manual Brev stop command run | false |
| ONNX export, model-card promotion, final-readiness claim | not performed |
| Final-gate weakening | not performed |

Final-promotion blockers remain unchanged and separate:
`tier0_hard_negative_far`, `no_zero_accepted_true_class`, full 17-type
negative-challenge coverage, threshold selection, ONNX export, and model-card
promotion are all still unresolved.

## Next Action

`detector0_table_second_hand_candidate_packet_review`

Rationale: the design is complete, current approved Tier 0 manifests contain
69 `table` clips across train/validation/test, and the next useful no-spend
slice is to create or review a bounded candidate packet without packet
mutation, approved box annotation, Detector 0 training, recognizer training, or
ablation rerun.
