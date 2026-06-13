# Return-To-Form Tier 0 Detector 0 Two-Hand Union Schema V1

Mission: M3AE-AB Detector 0 two-hand union schema revision.

Status: passed.

This is a schema-design artifact only. It does not mutate the approved
Detector 0 packet, train Detector 0, train the recognizer, rerun the
crop-normalization ablation, expand labels, import or approve sources, use
Brev compute, export ONNX, promote a model card, weaken final gates, touch
product runtime code, push, or claim readiness.

## Trigger Evidence

M3AE-AA proved that the expanded packet train path can fit locally, but the
held-out independent `table` `right_or_second_hand` target remains weak:

| Split | Table rows | Present support | Presence accuracy | Box MAE | Mean IoU |
| --- | ---: | ---: | ---: | ---: | ---: |
| train | 7 | 7 | 1.0 | 0.2194068431854248 | 0.35811835527420044 |
| validation | 7 | 7 | 0.2857142984867096 | 0.26238906383514404 | 0.11038082093000412 |
| test | 6 | 6 | 0.3333333432674408 | 0.293274849653244 | 0.05008930340409279 |

Retained conclusion: reviewed independent boxes exist, but independent
left/right targets are not the honest next target for overlapping or contacting
`table` hands. The remediation target is a derived
`table_two_hand_union_or_contact_region`, not final promotion evidence.

## Evidence Bindings

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-AA expanded-packet smoke | `docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json` | `baa2d2f958f50e299fb8d59e2ea2a0d081dd8995181da1719d60ead0c4971def` |
| M3AE-Z packet mutation | `docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json` | `0f8d8c43fcce041694df132b327407b8dca5d11e22b89ecadca42ace5221ce82` |
| Expanded Detector 0 packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec` |
| Observer localization memo | `artifacts/research/observer-201-localization-strategy-api-response.md` | `b6e167fbf5f40541f718153906d085b787d674fea3c055826dc900a01f4639e2` |
| Source register | `docs/model/dataset-source-register.json` | `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8` |
| Source coverage | `docs/research/return-to-form-tier0-source-coverage.json` | `1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378` |
| Fixed-crop config | `docs/model/return-to-form-fixed-crop-config.json` | `dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29` |
| Pre-training gates | `docs/validation/return-to-form-tier0-gates.json` | `2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97` |
| Decode dataloader | `docs/validation/return-to-form-tier0-decode-dataloader.json` | `d64c0b46500075d94207ef2197a6f6d8f1570cf548da8b08ca16dc520ba386c2` |
| Tensor contract | `docs/validation/return-to-form-tier0-tensor-contract.json` | `0f2ea12cf9a6517bafb67876ba4b0e4951ce821b61b27a740d45f6d1e36b3cd3` |
| M3AE-P Detector 0 smoke | `docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json` | `ba8871964ba24bae88935bcad24c132af90dcd8d607bef04df54f56ebdd3b611` |
| M3AE-U optional-target policy | `docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md` | `565a34fa0029345b64d9f1ac485d2c474a79f33fd4a5bec786ac8e69fe99b4a8` |
| M3AE-V policy-aware smoke | `docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json` | `fdf665aa6d223b60cbe9804f47f2b0b8619b6a8c7273bd79ba5696fee45af304` |
| M3AE-W support remediation | `docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json` | `ab42d0f02b037fafde3e5299d513a4b671b685e83bf1d9654d23cd89f2a6783a` |
| M3AE-X expansion design | `docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md` | `ef9b84fd891c6e69e91259f26059a7ce69f0b75f1e3f860673551eea2b3f2717` |
| M3AE-Y candidate review | `docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md` | `1f132125dee5bbb0c4d57bd325ffcca04a2c6921abc434ac02ee93f69471c09e` |

## Target Semantics

New target id:

```text
table_two_hand_union_or_contact_region
```

Meaning:

- For `label_id=table` rows, the target represents the minimum enclosing
  normalized full-frame region covering the two active hands during the
  `table` contact/overlap signing phase.
- It is a box target, not a landmark target and not a pretrained detector
  substitute.
- It is derived from already reviewed `left_or_first_hand` and
  `right_or_second_hand` boxes only as provenance-bound evidence.
- It is a remediation target for the Detector 0 localization lane. It is not
  final product evidence, not a recognition claim, and not an ONNX/export
  promotion gate.

Target fields match the existing Detector 0 target object shape:

```text
presence
center_xy_norm
box_xyxy_norm
visibility_confidence
occlusion_flag
truncation_flag
```

## Presence Rules

For rows with `label_id=table`:

- Present when both `left_or_first_hand.presence=true` and
  `right_or_second_hand.presence=true`, both boxes are non-null normalized
  `xyxy`, and the row review status is `manual_verified` or
  `manual_corrected`.
- Unresolved for manual review when either source hand box is absent, null,
  malformed, below `visibility_confidence < 0.45`, or explicitly marked as
  rejected in a future packet state.
- Unresolved when the derived union would be implausibly broad for the frame:
  width > `0.85`, height > `0.85`, or area > `0.55` after clipping.

For rows where `label_id` is not `table`:

- The target is present `false`.
- `center_xy_norm` and `box_xyxy_norm` are `null`.
- `visibility_confidence` is `0`.
- `occlusion_flag` and `truncation_flag` are `false`.
- This absent state is a label-applicability decision, not negative evidence
  about two-hand table contact.

## Derivation Rules

For each present `table` row in the later packet-mutation slice:

1. Read existing reviewed `left_or_first_hand.box_xyxy_norm` and
   `right_or_second_hand.box_xyxy_norm`.
2. Compute the raw union:

```text
x1 = min(left.x1, right.x1)
y1 = min(left.y1, right.y1)
x2 = max(left.x2, right.x2)
y2 = max(left.y2, right.y2)
```

3. Add a fixed normalized context margin of `0.02` to all sides, then clip to
   `[0.0, 1.0]`.
4. Store `box_xyxy_norm=[x1, y1, x2, y2]`.
5. Store `center_xy_norm=[(x1+x2)/2, (y1+y2)/2]`.
6. Set `visibility_confidence` to
   `max(0.0, min(left.visibility_confidence, right.visibility_confidence) - 0.05)`,
   rounded to three decimals. The 0.05 reduction marks the target as derived
   rather than independently reviewed.
7. Set `occlusion_flag` to `left.occlusion_flag OR right.occlusion_flag`.
8. Set `truncation_flag` to `left.truncation_flag OR right.truncation_flag OR
   clipped_margin_changed_the_raw_union`.
9. Append a row-level note naming the source target ids and stating that the
   union/contact target was derived from reviewed boxes without pretrained
   landmarks, detector outputs, generated pseudo-labels, new media, or source
   expansion.

The later mutation must stop on any row-id collision, malformed target object,
unexpected packet hash, unexpected packet status, or unresolved table row.

## Later Packet Mutation Scope

The next packet-mutation slice may:

- add `table_two_hand_union_or_contact_region` to the packet target schema;
- add a target object for every current packet row;
- derive present union/contact targets only for existing approved
  `label_id=table` rows in the 32-row packet;
- mark the target absent for all non-table rows;
- write one mutation receipt binding pre/post packet hashes, derived row ids,
  unresolved counts, and no-pretrained/source/Brev boundaries.

The next packet-mutation slice must not:

- add rows;
- import or approve sources;
- use generated pseudo-labels;
- use pretrained detector, landmark, pose, feature, or embedding outputs;
- train Detector 0;
- rerun the crop-normalization ablation;
- train the recognizer;
- touch product runtime code;
- weaken final gates or claim readiness.

Expected derived positive support, if all current reviewed table rows pass the
rules:

```text
train=7
validation=7
test=6
```

## Validation Gates For First Union-Target Smoke

Before any smoke that consumes the union/contact target:

- packet hash must match the later mutation receipt post-hash;
- all target objects must validate against the existing Detector 0 target
  field shape;
- all current 20 table rows must have present derived union/contact targets,
  with support at least train 5, validation 5, test 5;
- unresolved table rows must be `0`, or the next action must be
  `detector0_data_or_target_remediation`;
- no new source id, label id, tensor path, or media path may appear.

For the first local no-spend union-target Detector 0 smoke:

- train only locally on CPU/MPS;
- use a random scratch model and no saved model artifact;
- report train/validation/test localization metrics for
  `table_two_hand_union_or_contact_region`;
- train-path sanity must meet:
  `train_presence_accuracy=1.0`, `train_present_box_mae <= 0.15`, and
  `loss_drop_fraction_from_initial_to_best >= 0.75`;
- held-out union/contact behavior must meet:
  validation and test `presence_accuracy >= 0.80`,
  `box_mae_if_present <= 0.30`, and `mean_iou_if_present > 0.05`;
- if train-path sanity fails, select `detector0_data_or_target_remediation`;
- if train-path sanity passes but held-out union/contact behavior fails, select
  `detector0_two_hand_union_schema_continue` or
  `detector0_data_or_target_remediation`, not a crop-normalization ablation;
- if all gates pass, a later observer may consider a bounded
  crop-normalization comparison prompt, but this artifact does not authorize
  that rerun.

Required-target versus optional-target accounting:

- `table_two_hand_union_or_contact_region` is required only for rows where
  `label_id=table` and derivation succeeds.
- For non-table rows, absent target state is report-only applicability.
- The M3AE-U optional-target policy for independent `right_or_second_hand`
  remains unchanged and separate.

## Review And Provenance Requirements

The later mutation receipt must record:

- packet pre/post SHA-256;
- source packet row ids;
- source hand target ids used for each derived target;
- derived box, center, confidence, and flags;
- unresolved rows and reasons;
- source register hash;
- M3AE-AA smoke receipt hash;
- M3AE-Z mutation receipt hash;
- Brev no-spend proof;
- final-promotion blocker separation;
- exactly one next action.

Human/manual review is required before mutation if any current table row is
unresolved by the rules above. No source broadening, synthetic clip creation,
or external detector/landmark pass is permitted to fill unresolved rows in the
next slice.

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
kill_condition=not_applicable_no_remote_training
expected_metric_signal=none_schema_design_only
human_spend_approval=false
manual_stop_command=brev stop asl-pilot-rawframe-001
manual_stop_command_run=false
```

## Boundary Checklist

| Boundary | Status |
| --- | --- |
| Packet mutation | not performed |
| Detector 0 training | not performed |
| Crop-normalization ablation rerun | not performed |
| Recognizer training | not performed |
| Classifier microprobe or broad smoke | not performed |
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

`detector0_two_hand_union_packet_mutation`

This next action is limited to a bounded local packet-mutation slice that adds
the derived `table_two_hand_union_or_contact_region` target to existing
approved packet rows and writes a mutation receipt. It does not authorize
training, ablation rerun, source expansion, product-runtime work, export,
promotion, Brev spend, or final-readiness claims.
