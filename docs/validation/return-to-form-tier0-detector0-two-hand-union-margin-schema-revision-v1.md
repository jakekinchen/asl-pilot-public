# Return-To-Form Tier 0 Detector 0 Two-Hand Union Margin Schema Revision V1

Mission: M3AE-AE Detector 0 two-hand union margin schema revision.

Status: schema revision selected.

This is a design-only schema artifact. It does not mutate the approved
Detector 0 packet, add rows, train Detector 0, rerun the crop-normalization
ablation, train the recognizer, expand labels, evaluate controlled
clip-heldout, import or approve sources, use Brev compute, export ONNX,
promote a model card, weaken final gates, touch product runtime code, push, or
claim final readiness.

## Trigger Evidence

M3AE-AD preserved the unresolved row
`det0-v0-train-table-000376-f010` as a schema-policy issue, not a row-quality
or provenance issue:

```text
classification=schema_threshold_margin_policy_issue
raw_union_box=[0.02, 0.57, 0.86, 0.82]
raw_union_width=0.84
raw_union_height=0.25
raw_union_area=0.21
context_margin_norm=0.02
old_margin_box=[0, 0.55, 0.88, 0.84]
old_margin_width=0.88
width_limit=0.85
width_overage=0.03
packet_correction_performed=false
```

The reviewed source boxes are present, normalized, manually corrected, and
above the source visibility threshold. The raw union itself is within the
M3AE-AB width, height, and area limits; the failure is caused only by treating
the desired fixed context margin as an all-or-nothing validity condition.

## Evidence Bindings

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| Source register | `docs/model/dataset-source-register.json` | `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8` |
| Source coverage | `docs/research/return-to-form-tier0-source-coverage.json` | `1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378` |
| Fixed-crop config | `docs/model/return-to-form-fixed-crop-config.json` | `dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29` |
| Pre-training gates | `docs/validation/return-to-form-tier0-gates.json` | `2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97` |
| Decode dataloader | `docs/validation/return-to-form-tier0-decode-dataloader.json` | `d64c0b46500075d94207ef2197a6f6d8f1570cf548da8b08ca16dc520ba386c2` |
| Tensor contract | `docs/validation/return-to-form-tier0-tensor-contract.json` | `0f2ea12cf9a6517bafb67876ba4b0e4951ce821b61b27a740d45f6d1e36b3cd3` |
| Detector 0 bootstrap | `docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json` | `bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5` |
| Detector 0 training smoke | `docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json` | `ba8871964ba24bae88935bcad24c132af90dcd8d607bef04df54f56ebdd3b611` |
| Crop-normalization ablation smoke | `docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json` | `b3c86cc08a82bdbe8ca212c26f8bc0287514ca559ad7beac0f9f41c8e21b20a7` |
| Optional-target policy | `docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md` | `565a34fa0029345b64d9f1ac485d2c474a79f33fd4a5bec786ac8e69fe99b4a8` |
| Optional-target support remediation | `docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json` | `ab42d0f02b037fafde3e5299d513a4b671b685e83bf1d9654d23cd89f2a6783a` |
| Table second-hand mutation | `docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json` | `0f8d8c43fcce041694df132b327407b8dca5d11e22b89ecadca42ace5221ce82` |
| Expanded packet smoke | `docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json` | `baa2d2f958f50e299fb8d59e2ea2a0d081dd8995181da1719d60ead0c4971def` |
| M3AE-AB union schema | `docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md` | `4e0972b77304c09ffa3e4f5fee4c3b9f71c26f6efe2fe14a13eed82773892716` |
| M3AE-AC union packet mutation | `docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json` | `0a0b1a89c904f19bba38e56e5cc08dbe7a23b9e47a7e596785488bcccac6cf28` |
| M3AE-AD union target remediation | `docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json` | `f9b8111c0cda034f8c19e8aaab271851a0daa97de744d32f04c1019d4ae58553` |
| Current Detector 0 packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `b0456313f78f0ddb9a4656876f2021046e4324f8cd06bc7a62021579ff56144f` |
| Train manifest | `data/manifests/return-to-form-tier0/train.json` | `03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de` |
| Validation manifest | `data/manifests/return-to-form-tier0/validation.json` | `23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808` |
| Test manifest | `data/manifests/return-to-form-tier0/test.json` | `b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed` |
| Observer localization memo | `artifacts/research/observer-201-localization-strategy-api-response.md` | `b6e167fbf5f40541f718153906d085b787d674fea3c055826dc900a01f4639e2` |

## Selected Semantics

The revised policy is a bounded adaptive context-margin policy.

Hard source and raw-union validity rules remain unchanged:

- For `label_id=table`, the target still requires reviewed
  `left_or_first_hand` and `right_or_second_hand` boxes, each present,
  normalized, and with visibility confidence at least `0.45`.
- Source rows still must be `manual_verified` or `manual_corrected`.
- The source boxes remain evidence only; the derived target is not an
  independent manual box and not a pretrained detector/landmark substitute.
- The raw two-hand union must pass `max_width_norm=0.85`,
  `max_height_norm=0.85`, and `max_area_norm=0.55`.
- If the raw union itself fails a hard limit, the row remains unresolved for
  data/target remediation.

The M3AE-AB fixed `0.02` context margin is reinterpreted as a desired maximum
context margin, not a hard requirement that can make an otherwise valid raw
union unresolved. For later packet mutation:

1. Compute the raw union from the reviewed left/right boxes.
2. Validate the raw union against the hard width, height, and area limits.
3. Add up to `0.02` normalized context per side.
4. Reduce context per axis as needed so the final target box remains inside
   `[0, 1]` and does not exceed `max_width_norm=0.85` or
   `max_height_norm=0.85`.
5. If the resulting context box would exceed `max_area_norm=0.55`, reduce
   context without shrinking the raw union until the area cap is met.
6. If no non-negative context box can contain a raw union that already passed
   the hard limits, stop as a schema inconsistency rather than editing packet
   metadata.

The later mutation receipt must record effective context margins whenever they
are smaller than `0.02`. Context reduction is provenance metadata, not a source
box correction. `truncation_flag` remains driven by source target truncation or
raw-union clipping; adaptive context reduction alone must be recorded in the
row note/receipt and must not be used as pretrained or generated evidence.

## Edge-Case Handling

For `det0-v0-train-table-000376-f010`, the revised policy handles the row as a
valid present union/contact target in the later packet-mutation slice:

```text
raw_union_box=[0.02, 0.57, 0.86, 0.82]
raw_union_width=0.84
raw_union_height=0.25
raw_union_area=0.21
desired_margin=0.02
effective_margin_x=0.005
effective_margin_y=0.02
revised_box=[0.015, 0.55, 0.865, 0.84]
revised_width=0.85
revised_height=0.29
revised_area=0.2465
revised_center=[0.44, 0.695]
revised_visibility_confidence=0.57
```

A read-only derivation check over the current 20 table rows found that the old
M3AE-AB fixed-margin rule fails only this row, while the revised bounded
adaptive-margin rule leaves zero table rows failing the width cap. If applied
in a later packet-mutation slice, expected present support becomes:

```text
train=7
validation=7
test=6
unresolved_table_rows=0
```

This artifact does not apply that mutation. It only selects the schema policy
that the next bounded packet-mutation slice should use.

## Boundaries

| Boundary | Status |
| --- | --- |
| Packet mutation | not performed |
| Row addition | not performed |
| Detector 0 training | not performed |
| Crop-normalization ablation rerun | not performed |
| Recognizer training | not performed |
| Label expansion | not performed |
| Controlled clip-heldout evaluation | not performed |
| Source approval/import | not performed |
| Unapproved media import | not performed |
| Synthetic clips | not created |
| Pretrained detector/landmark/pose/backbone/embedding use | not used |
| Generated pseudo-label source | not used |
| Product runtime code change | not performed |
| ONNX export | not performed |
| Model-card promotion | not performed |
| Final readiness claim | not made |
| Final gate weakening | not performed |
| Brev sync/training/spend | not performed |
| Brev stop | not performed |
| Duplicate Brev worker | not created |
| Push | not performed |

## Brev No-Spend Boundary

```text
brev_command=brev ls --json
workspace=asl-pilot-rawframe-001
status=RUNNING
build_status=COMPLETED
shell_status=READY
health_status=HEALTHY
instance_type=massedcompute_A100_sxm4_80G_DGX
instance_kind=gpu
gpu=A100
planned_remote_command=none
max_runtime_minutes=0
max_spend_usd=0
human_spend_approval=false
manual_stop_command=brev stop asl-pilot-rawframe-001
manual_stop_command_run=false
```

## Final-Promotion Blocker Separation

This schema revision does not assess or satisfy final-promotion gates:

```text
hard_negative_far_assessed=false
no_zero_accepted_true_class_assessed=false
final_promotion_negative_challenge_blocker=unchanged
threshold_selected=false
onnx_export=false
model_card_promotion=false
final_readiness_claim=false
final_gate_weakening=false
```

## Next Action

`detector0_two_hand_union_packet_mutation_continue`

This next action is limited to a bounded local packet-mutation slice that
updates existing `table_two_hand_union_or_contact_region` targets according to
the bounded adaptive context-margin semantics above. It must not add rows,
train Detector 0, rerun the crop-normalization ablation, train the recognizer,
expand labels, import or approve sources, touch product runtime code, use Brev
compute, export ONNX, promote a model card, weaken final gates, claim final
readiness, push, or redirect to a broad run.
