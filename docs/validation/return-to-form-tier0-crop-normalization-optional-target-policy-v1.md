# Return-To-Form Tier 0 Crop Normalization Optional-Target Policy V1

Mission: M3AE-U crop-normalization optional-target policy revision.
Generated: 2026-05-26T01:09:19Z.
Status: `policy_defined`.

## Purpose

M3AE-S failed the crop-normalization fallback gate because
`right_or_second_hand` fallback was counted as a transform failure on every
decision, even though M3AE-T showed the verified Detector 0 packet marks that
target absent in 12 of 15 rows.

This policy preserves that remediation finding and changes the next ablation
accounting rule: verified absent optional targets are diagnostic fallback, not
transform failure, while missed present targets remain gate-affecting.

This artifact does not rerun the ablation smoke, train Detector 0, train the
recognizer, mutate the packet, edit implementation code, use Brev compute,
expand labels, import or approve sources, export ONNX, promote a model card,
change final gates, or claim readiness.

## Source Artifacts

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-T remediation receipt | `docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json` | `4ca5fbd2a10acb0d8d817370e6778466d989a61b6c939b1f87f1066eb6091f28` |
| M3AE-S ablation smoke receipt | `docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json` | `b3c86cc08a82bdbe8ca212c26f8bc0287514ca559ad7beac0f9f41c8e21b20a7` |
| Detector 0 packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34` |
| M3AE-Q ablation design | `docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md` | `5658eec611b40459ff6473dad1338a718572c40cb297a6f704563f8f657d1316` |
| M3AE-P Detector 0 smoke | `docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json` | `ba8871964ba24bae88935bcad24c132af90dcd8d607bef04df54f56ebdd3b611` |
| M3AE-L Detector 0 bootstrap | `docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json` | `bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5` |
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

## Preserved Remediation Finding

M3AE-T is the source of truth for the M3AE-S fallback failure:

```text
root_cause=optional_second_hand_target_policy_mismatch
right_or_second_hand_packet_rows=15
right_or_second_hand_present_rows=3
right_or_second_hand_absent_rows=12
right_or_second_hand_absent_rate=0.8
right_or_second_hand_present_rows_are_all_label=table
right_or_second_hand_fallback_rate_in_m3ae_s=0.8110507246376811
fallback_reason_in_m3ae_s=below_presence_threshold
```

Required Detector 0 targets remain fully supported in the packet:

```text
left_or_first_hand_present_rate=1.0
head_or_face_present_rate=1.0
upper_body_or_signing_space_present_rate=1.0
```

The `right_or_second_hand` target is optional for this Tier 0 packet. Its
current positive support is sparse: 3 of 15 packet rows, all on `table`, with
one train row, one validation row, and one test row.

## Target Classes

Future crop-normalization accounting must classify each target decision before
computing fallback gates:

| Class | Meaning | Gate treatment |
| --- | --- | --- |
| `verified_absent_optional_target` | The reviewed packet support says the optional target is absent for the applicable label or reviewed row, and the detector output is absent, below threshold, or intentionally falls back to the fixed crop. | Report-only diagnostic. Exclude from transform-failure numerator and denominator. |
| `predicted_absent_optional_target` | The optional target prediction is absent or below threshold. This is only acceptable when paired with verified absent optional support. | Reclassify as `verified_absent_optional_target` when expected absent; reclassify as `missed_present_optional_target` when expected present. |
| `missed_present_optional_target` | The reviewed packet support says the optional target is present, but the detector output is absent, below threshold, invalid, or cannot produce a usable box. | Gate-affecting fallback. Count by split, label, target id, and reason. |
| `predicted_present_target_with_usable_box` | The target prediction is present, coordinate-valid, source-bound, and crop-resizable to the recognizer contract. | Passing transform decision. |
| `malformed_or_source_invalid_target` | The target decision has malformed coordinates, missing tensor provenance, source-id mismatch, shape mismatch, or any unapproved source/pretrained dependency. | Hard failure. Count against gates and stop the run. |

For required targets, absence or below-threshold fallback remains
gate-affecting. The optional-target exclusion applies only to verified absent
`right_or_second_hand` decisions in this Tier 0 policy.

## Current Expected-Support Map

The next policy-aware smoke may use this packet-derived support map for the
current five-label Tier 0 set only:

| Label | `right_or_second_hand` packet support | Policy expectation |
| --- | --- | --- |
| `please` | 0 present, 3 absent | expected optional absence |
| `dad` | 0 present, 3 absent | expected optional absence |
| `grandpa` | 0 present, 3 absent | expected optional absence |
| `hat` | 0 present, 3 absent | expected optional absence |
| `table` | 3 present, 0 absent | expected optional presence |

This map is not permission to expand labels or infer a general ASL rule. If a
future run includes labels without packet support for optional-target presence,
it must classify that support as unresolved and stop before making promotion
claims.

## Policy-Aware Gate Recommendations

Keep the M3AE-Q transform-integrity caps, but compute them on policy-aware
fallback classes:

```text
gateable_overall_fallback_rate_max=0.40
gateable_per_target_fallback_rate_max=0.60
required_targets=left_or_first_hand,head_or_face,upper_body_or_signing_space
optional_targets=right_or_second_hand
```

Gateable fallback numerator:

- required-target missing, below-threshold, invalid, or fixed-crop fallback;
- optional-target `missed_present_optional_target`;
- any `malformed_or_source_invalid_target`.

Gateable fallback denominator:

- all required-target decisions;
- optional-target decisions where packet support expects presence;
- malformed or source-invalid optional-target decisions.

Report-only optional diagnostics:

- count and rate of `verified_absent_optional_target` decisions by split,
  label, target id, and reason;
- count and rate of optional-target false positives on labels where packet
  support expects absence;
- count and rate of unresolved optional-target support, which must be zero for
  this Tier 0 policy-aware rerun.

The next smoke must still report the original raw fallback counts beside the
policy-aware counts so M3AE-S remains comparable. If the `table` expected-present
subset still exceeds the 0.60 optional missed-present cap, classify that as a
real Detector 0 optional-target support or localization issue, not as verified
absence.

## Boundaries

| Boundary | Status |
| --- | --- |
| Policy-only artifact | satisfied |
| Implementation-code edit | not performed |
| Detector 0 packet mutation | not performed |
| Ablation rerun in this slice | not performed |
| Detector 0 training in this slice | not performed |
| Recognizer training in this slice | not performed |
| Label expansion | not performed |
| Controlled clip-heldout evaluation | not performed |
| Source approval or media import | not performed |
| Pretrained detector, landmark, backbone, embedding, or pseudo-label source | not used |
| Brev sync, SSH, training, stop, or compute | not performed |
| Brev status check | `brev ls --json` only |
| Existing Brev worker | `asl-pilot-rawframe-001` remains running and healthy |
| Manual Brev stop command | `brev stop asl-pilot-rawframe-001` |
| Manual Brev stop command run | false |
| ONNX export, model-card promotion, final-readiness claim | not performed |
| Final-gate weakening | not performed |

Final-promotion blockers remain unchanged and separate from this policy:
`tier0_hard_negative_far`, `no_zero_accepted_true_class`, full 17-type
negative-challenge coverage, threshold selection, ONNX export, and model-card
promotion are all still unresolved.

## Next Action

`crop_normalization_policy_aware_ablation_smoke`

Rationale: the policy now separates verified absent optional targets from
missed present optional targets without changing final gates or source scope.
The next useful slice is one bounded local ablation smoke rerun that reports
both raw fallback and policy-aware fallback accounting, uses only existing
approved Tier 0 artifacts, and performs no Brev spend, label expansion, source
approval, packet mutation, export, model-card promotion, or readiness claim.
