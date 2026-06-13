# Return-To-Form Tier 0 Detector 0 Annotation Follow-Up V1

Mission: M3AE-O Detector 0 annotation follow-up.
Generated: 2026-05-25T23:43:31Z.

## Disposition

The M3AE-N rejected held-out `hat` row was replaced with an approved PopSign
Tier 0 test clip/frame. The original row remains documented here for audit, but
the packet no longer contains a rejected Detector 0 training row.

| Field | Rejected row | Replacement row |
| --- | --- | --- |
| Row id | `det0-v0-test-hat-001502-f005` | `det0-v0-test-hat-001503-f010` |
| Clip id | `popsign-v1-test-hat-001502` | `popsign-v1-test-hat-001503` |
| Source record | `popsign_v1_0/game/test/hat/gtsignstudy4a.8032-hat-2023_01_24_20_44_49.323-0.mp4` | `popsign_v1_0/game/test/hat/gtsignstudy4a.8032-hat-2023_01_25_21_11_53.095-1.mp4` |
| Source video sha256 | `a08050f7a82f8362ff086a325cd58b7d057a777e6aba3cae8f1a3a24b9a834b7` | `325bbb1df0f56e92e84e1c855d0158f72d7ab177712cdca5921a198a93666edf` |
| Frame index | `5` | `10` |
| Timestamp seconds | `0.417` | `0.833` |
| Tensor path | `../../tensors/return-to-form-tier0/test/popsign-v1-test-hat-001502-regions.pt` | `../../tensors/return-to-form-tier0/test/popsign-v1-test-hat-001503-regions.pt` |
| Tensor file sha256 | `79e815a302aef5e7c50867d3104443a3bfaa3f35aa74b2d77e8752ad5f15fb49` | `016e8dd4b2047864738fe8596ee7b34cc355b10eef5c7aebfd1f81e3059ff4ca` |
| Tensor digest sha256 | `154a01d6df89e8479b5559c0e7fbd845b63eadebaffe5d713f3c8a05a24df048` | `62537578f0baa21f8c1f4ffb7aed0a5aef2006d080b7c0c32c194f552d557002` |
| Label source | `project_manual_box_label` | `manual_verified_from_fixed_crop_context` |
| Review status | `rejected_for_insufficient_visual_evidence` | `manual_corrected` |

Replacement target boxes were drawn in normalized full-frame `xyxy`
top-left-origin coordinates from the retained visual evidence. The replacement
uses the same approved PopSign signer hash as the rejected row:
`dea2b45d14f9aa79f926bb30c35ac5280848249c9268afedb27088d019cb2e25`.

## Packet State

| Count | Value |
| --- | ---: |
| Total rows | 15 |
| Train rows | 5 |
| Validation rows | 5 |
| Test rows | 5 |
| Labels | `please`, `table`, `dad`, `grandpa`, `hat` |
| Manual verified rows | 6 |
| Manual corrected rows | 9 |
| Rejected rows | 0 |
| Rows still `needs_manual_verification` | 0 |

Status after follow-up:
`reviewed_packet_ready_for_detector0_smoke`.

Ready classification:
`ready_for_tiny_scratch_detector0_smoke_only`.

This does not change final-promotion gates or product readiness.

## Evidence Inspected

- Current Detector 0 packet:
  `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
- M3AE-N review report:
  `docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`
- Tier 0 test manifest:
  `data/manifests/return-to-form-tier0/test.json`
- Retained contact sheet:
  `docs/validation/return-to-form-tier0-remediation-contact-sheets/hat.png`
- Temporary untracked overlay rendered from the replacement tensor's
  `rgb_regions` `full_frame_reference` frame:
  `/tmp/asl-pilot-hat-001503-f010-overlay-v2.png`

The contact sheet showed `popsign-v1-test-hat-001503` frame 10 with clearer
hand-to-head/hat contact than the rejected dark `001502` frame. The temporary
overlay was used only for local visual review and was not committed.

## Hashes

```text
packet_before=327d1e478e22a073bb953419a07d5c1236ff4bc061f4f323c360c063cdc3faa3
packet_after=ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34
source_register=b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8
source_coverage=1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378
crop_config=dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29
pre_training_gates=2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97
bootstrap_report=bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5
train_manifest=03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de
validation_manifest=23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808
test_manifest=b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed
```

## Boundary Checks

| Check | Status |
| --- | --- |
| Replacement uses existing approved PopSign Tier 0 evidence | passed |
| Replacement is held-out `hat` test coverage | passed |
| Packet `frame_rows` mutation is limited to the rejected row | passed |
| Packet tensor paths resolve and tensor hashes match manifests | passed |
| MediaPipe/OpenPose/YOLO/RTMPose/pretrained detector or landmark labels used | none |
| New source approval, unapproved media import, Detector 0 training, recognizer training, crop-normalization ablation, export, promotion, final-readiness claim, final-gate weakening | not performed |

Validation commands passed in this slice:

```text
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty ...
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
```

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
This follow-up does not select a classifier threshold, evaluate hard negatives,
export ONNX, promote a model card, claim final readiness, or weaken the
17-type final-promotion negative-challenge gate.

## Next Action

`detector0_training_smoke`
