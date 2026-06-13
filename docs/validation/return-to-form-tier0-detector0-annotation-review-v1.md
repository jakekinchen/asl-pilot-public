# Return-To-Form Tier 0 Detector 0 Annotation Review V1

Mission: M3AE-N Detector 0 annotation review.
Generated: 2026-05-25T23:23:41Z.

## Packet

- Packet:
  `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
- Status after review: `reviewed_packet_needs_followup`
- Coordinate space: normalized full-frame `xyxy`, top-left origin
- Selected labels: `please`, `table`, `dad`, `grandpa`, `hat`
- Reviewer: `codex_executor_visual_overlay_review`
- Review timestamp: `2026-05-25T23:23:41Z`

The review inspected the retained contact sheets under
`docs/validation/return-to-form-tier0-remediation-contact-sheets/` and a local
overlay rendered from each packet row's `rgb_regions` `full_frame_reference`
tensor frame. No external media, pretrained detector, pose, landmark, or
generated pseudo-label source was used.

## Counts

| Count | Value |
| --- | ---: |
| Total rows | 15 |
| Reviewed rows | 15 |
| Manual verified rows | 6 |
| Manual corrected rows | 8 |
| Rejected rows | 1 |
| Rows still `needs_manual_verification` | 0 |
| Rows ready for Detector 0 training | 0 |

## Row Review

| Row | Status | Label source | Review note |
| --- | --- | --- | --- |
| `det0-v0-train-please-000076-f010` | `manual_verified` | `manual_verified_from_fixed_crop_context` | Existing hand, head, and signing-space boxes accepted. |
| `det0-v0-validation-please-000076-f005` | `manual_verified` | `manual_verified_from_fixed_crop_context` | Existing hand, head, and signing-space boxes accepted. |
| `det0-v0-test-please-000058-f010` | `manual_verified` | `manual_verified_from_fixed_crop_context` | Existing hand, head, and signing-space boxes accepted. |
| `det0-v0-train-table-000376-f010` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Both hand boxes moved down to cover the visible horizontal table-sign hand/forearm region. |
| `det0-v0-validation-table-000376-f005` | `manual_verified` | `manual_verified_from_fixed_crop_context` | Existing two-hand boxes accepted. |
| `det0-v0-test-table-000286-f005` | `manual_verified` | `manual_verified_from_fixed_crop_context` | Existing two-hand boxes accepted. |
| `det0-v0-train-dad-000826-f010` | `manual_verified` | `manual_verified_from_fixed_crop_context` | Existing hand-over-face box accepted with occlusion. |
| `det0-v0-validation-dad-000826-f005` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box moved up and left; truncation flag set. |
| `det0-v0-test-dad-000628-f005` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box moved up and left; truncation flag set. |
| `det0-v0-train-grandpa-000951-f010` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box moved to cover the left-edge hand/face overlap; occlusion and truncation flags set. |
| `det0-v0-validation-grandpa-000952-f005` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box moved up and left; truncation flag set. |
| `det0-v0-test-grandpa-000723-f005` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box moved left/down to cover the raised hand. |
| `det0-v0-train-hat-001976-f010` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box widened upward around the hat/forehead contact; occlusion and truncation flags set. |
| `det0-v0-validation-hat-001976-f005` | `manual_corrected` | `manual_verified_from_fixed_crop_context` | Hand box moved down to cover the visible hand beside the hat. |
| `det0-v0-test-hat-001502-f005` | `rejected_for_insufficient_visual_evidence` | `project_manual_box_label` | Frame is too dark and ambiguous for reliable hand localization. Do not train on this row until replaced or human-verified. |

## Hashes

```text
packet_before=558c271339f178c86441d6c77cd71dcf6def11997b39f0017e8fc0b3a783512a
packet_after=327d1e478e22a073bb953419a07d5c1236ff4bc061f4f323c360c063cdc3faa3
source_register=b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8
source_coverage=1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378
crop_config=dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29
pre_training_gates=2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97
bootstrap_report=bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5
train_manifest=03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de
validation_manifest=23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808
test_manifest=b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed
```

## Provenance And Boundary Checks

| Check | Status |
| --- | --- |
| Stable `row_id`, `clip_id`, split, source id, source record, signer hash, tensor path/hash, and frame index preserved | passed |
| Every row has reviewer, reviewed timestamp, and one allowed review status | passed |
| Only allowed label sources used: `project_manual_box_label`, `manual_verified_from_fixed_crop_context` | passed |
| Packet tensor paths resolve and `frame_tensor_sha256` values match | passed |
| MediaPipe/OpenPose/YOLO/RTMPose/pretrained detector or landmark labels used | none |
| Source approval, unapproved media import, Detector 0 training, recognizer training, crop-normalization ablation, export, promotion, final-readiness claim, final-gate weakening | not performed |

## Readiness Classification

`not_ready_for_detector0_training`.

Reason: 14 rows now have manual visual overlay review provenance, but
`det0-v0-test-hat-001502-f005` is rejected for insufficient visual evidence.
Detector 0 training remains blocked until that held-out `hat` row is replaced
or independently verified.

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
This review does not select a classifier threshold, evaluate hard negatives,
export ONNX, promote a model card, claim final readiness, or weaken the
17-type final-promotion negative-challenge gate.

## Next Action

`detector0_annotation_review_continue`.

Replace or independently verify the rejected `hat` test row, then reclassify
whether the packet is ready for a tiny scratch Detector 0 smoke.
