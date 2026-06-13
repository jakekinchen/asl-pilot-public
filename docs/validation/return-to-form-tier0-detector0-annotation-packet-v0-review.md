# Return-To-Form Tier 0 Detector 0 Annotation Packet V0 Review

Mission: M3AE-M Detector 0 annotation packet.
Generated: 2026-05-25T23:02:30Z.

## Packet

- Packet:
  `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
- Status: `seed_packet_needs_manual_verification`
- Coordinate space: normalized full-frame `xyxy`, top-left origin
- Selected labels: `please`, `table`, `dad`, `grandpa`, `hat`
- Label source used: `project_manual_box_label`
- Review status used: `needs_manual_verification`

The packet contains contact-sheet visual seed rows only. It is not ready for
Detector 0 training until a human/manual overlay review verifies or corrects
the boxes.

## Counts

| Count | Value |
| --- | ---: |
| Total rows | 15 |
| Train rows | 5 |
| Validation rows | 5 |
| Test rows | 5 |
| Rows per selected label | 3 |
| `left_or_first_hand` present | 15 |
| `right_or_second_hand` present | 3 |
| `head_or_face` present | 15 |
| `upper_body_or_signing_space` present | 15 |
| Rows needing manual verification | 15 |
| Rows ready for Detector 0 training | 0 |

## Provenance Checks

| Check | Status |
| --- | --- |
| Source id is `popsign-v1-original-videos` for every row | passed |
| Rows bind `clip_id`, `label_id`, `split`, `source_record_id`, signer hash, tensor path, tensor hash, and frame index | passed |
| Source-register hash recorded | passed |
| Source-coverage hash recorded | passed |
| Crop-config hash recorded | passed |
| Bootstrap report hash recorded | passed |
| Manifest hashes recorded for train, validation, and test | passed |
| Disallowed pretrained/generated label sources used | none |

## Hashes

```text
source_register=b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8
source_coverage=1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378
crop_config=dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29
pre_training_gates=2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97
bootstrap_report=bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5
train_manifest=03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de
validation_manifest=23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808
test_manifest=b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed
```

## No-Pretrained Boundary

The packet does not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained detector
outputs, pretrained landmarks, generated pseudo-labels, unknown labels,
unapproved datasets, synthetic clips, or imported media. It uses only existing
approved PopSign Tier 0 manifests and retained contact-sheet visual review.

## Readiness Classification

`not_ready_for_detector0_training`.

Reason: the packet has useful provenance-bound seed rows, but all rows still
carry `review_status=needs_manual_verification`. The next slice should verify
or correct the seed boxes with manual overlay review before Detector 0 training
or crop-normalization ablation.

## Brev Status

`brev ls --json` reported:

```text
workspace=asl-pilot-rawframe-001
status=RUNNING
health_status=HEALTHY
instance_type=massedcompute_A100_sxm4_80G_DGX
manual_stop_command=brev stop asl-pilot-rawframe-001
manual_stop_command_run=false
```

## Final-Promotion Blocker Separation

The final-promotion negative-challenge blocker remains separate and unchanged.
This annotation packet does not select a classifier threshold, evaluate hard
negatives, export ONNX, promote a model card, claim final readiness, or weaken
the 17-type final-promotion negative-challenge gate.

## Next Action

`detector0_annotation_review`.

Use the next slice to produce manual overlay review for
`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`,
verify or correct the seed boxes, and keep Detector 0 training blocked until
enough rows are manual-verified across train plus held-out validation/test.
