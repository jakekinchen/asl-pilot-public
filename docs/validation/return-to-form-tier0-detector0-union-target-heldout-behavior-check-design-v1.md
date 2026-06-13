# Return-To-Form Tier 0 Detector 0 Union-Target Held-Out Behavior Check Design v1

## Metadata

- schema: `asl-pilot-return-to-form-tier0-detector0-union-target-heldout-behavior-check-design/v1`
- status: `action_selected`
- mission: M3AE-AM Detector 0 union-target held-out behavior check design
- checked_at: 2026-05-26T14:59:45Z
- target_id: `table_two_hand_union_or_contact_region`
- selected_formulation: `anchor_residual_coordconv_union_target_microprobe_v1`
- selected_signs: `please`, `table`, `dad`, `grandpa`, `hat`
- design_only: true
- microprobe_rerun: false
- detector0_training_run: false
- gradient_updates: 0
- model_artifact_exported: false
- model_card_promoted: false
- final_readiness_claim: false
- next_action: `detector0_union_target_heldout_behavior_check`

## Evidence Bound To This Design

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-AL architecture microprobe | `docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json` | `371be041d80fe3f70b65c6bc16b3a5112fa472df486cdd5b3a83a78e3f752dc4` |
| M3AE-AK architecture design | `docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md` | `d210860147354b8e69b71a1177fca6c61c1324fbdc4d2e2aca6c380a1b23b14d` |
| M3AE-AJ median baseline | `docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json` | `8cfee1e56bcf84dd6f3a13db7770c326d1a2e4b188d444bc8a23dd767a827181` |
| Observer-249 API diagnostic | `artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md` | `c22334c3ddd9270e2e591a6bca9464cbc1548d41bf58413af891088d1e61d62b` |
| M3AE-AI smoke continue | `docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json` | `090aa220d2efffaef41eb71805e4868d85112e6ceb6c822ab291a3c39759b4e6` |
| M3AE-AH remediation | `docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json` | `42dce721eff2fb015d68492fdc2900bc860a806795733e7c750fc863950833da` |
| M3AE-AG union smoke | `docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json` | `de1556d48a6c89bd020bddf2a1bf0b4e13393c8b27a3e436b840cbb925aca3b8` |
| Current packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d` |
| Source register | `docs/model/dataset-source-register.json` | `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8` |
| Fixed crop config | `docs/model/return-to-form-fixed-crop-config.json` | `dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29` |
| Pre-training gates | `docs/validation/return-to-form-tier0-gates.json` | `2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97` |
| Decode dataloader | `docs/validation/return-to-form-tier0-decode-dataloader.json` | `d64c0b46500075d94207ef2197a6f6d8f1570cf548da8b08ca16dc520ba386c2` |
| Tensor contract | `docs/validation/return-to-form-tier0-tensor-contract.json` | `0f2ea12cf9a6517bafb67876ba4b0e4951ce821b61b27a740d45f6d1e36b3cd3` |
| Train manifest | `data/manifests/return-to-form-tier0/train.json` | `03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de` |
| Validation manifest | `data/manifests/return-to-form-tier0/validation.json` | `23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808` |
| Test manifest | `data/manifests/return-to-form-tier0/test.json` | `b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed` |

## Source Facts

M3AE-AL passed only the train-fit gate:

```text
train_presence_accuracy=1.0
train_present_box_mae=0.02091207727789879
m3ae_aj_train_median_box_mae=0.04107142239809036
train_present_box_mean_iou=0.7846036553382874
m3ae_aj_train_median_box_mean_iou=0.6165503859519958
```

M3AE-AL did not prove held-out behavior:

```text
validation_presence_accuracy=0.27272728085517883
validation_false_positive_count=4
validation_false_negative_count=4
validation_present_box_mae=0.08475374430418015
validation_m3ae_aj_median_box_mae=0.02607143111526966
validation_present_box_mean_iou=0.43689242005348206
validation_m3ae_aj_median_box_mean_iou=0.7486294507980347

test_presence_accuracy=0.4000000059604645
test_false_positive_count=2
test_false_negative_count=4
test_present_box_mae=0.09988119453191757
test_m3ae_aj_median_box_mae=0.03791666775941849
test_present_box_mean_iou=0.38463327288627625
test_m3ae_aj_median_box_mean_iou=0.6775339245796204
```

The detector-like presence output is the held-out concern. On validation, all
four non-table rows were false positives and four of seven table rows were
false negatives. On test, two non-table rows were false positives and four of
six table rows were false negatives.

## Held-Out Rows To Inspect

### Validation Presence Errors

| Row | Label | Target present | Predicted present | Score | Box MAE if present | Delta vs median MAE |
| --- | --- | --- | --- | --- | --- | --- |
| `det0-v0-validation-please-000076-f005` | `please` | false | true | `0.9428495764732361` | n/a | n/a |
| `det0-v0-validation-dad-000826-f005` | `dad` | false | true | `0.9124937653541565` | n/a | n/a |
| `det0-v0-validation-grandpa-000952-f005` | `grandpa` | false | true | `0.9429096579551697` | n/a | n/a |
| `det0-v0-validation-hat-001976-f005` | `hat` | false | true | `0.9353167414665222` | n/a | n/a |
| `det0-v0-validation-table-000383-f010` | `table` | true | false | `0.20808440446853638` | `0.10961228609085083` | `0.09461227990686893` |
| `det0-v0-validation-table-000388-f008` | `table` | true | false | `0.14973853528499603` | `0.14078578352928162` | `0.1057857871055603` |
| `det0-v0-validation-table-000393-f008` | `table` | true | false | `0.2272205501794815` | `0.08961081504821777` | `0.07211080752313137` |
| `det0-v0-validation-table-000397-f008` | `table` | true | false | `0.30256783962249756` | `0.12221865355968475` | `0.09221865423023701` |

### Test Presence Errors

| Row | Label | Target present | Predicted present | Score | Box MAE if present | Delta vs median MAE |
| --- | --- | --- | --- | --- | --- | --- |
| `det0-v0-test-please-000058-f010` | `please` | false | true | `0.6987913250923157` | n/a | n/a |
| `det0-v0-test-grandpa-000723-f005` | `grandpa` | false | true | `0.5733041167259216` | n/a | n/a |
| `det0-v0-test-table-000288-f008` | `table` | true | false | `0.14602336287498474` | `0.16062048077583313` | `0.10562048852443695` |
| `det0-v0-test-table-000294-f008` | `table` | true | false | `0.1607218235731125` | `0.09936751425266266` | `0.08436750993132591` |
| `det0-v0-test-table-000297-f008` | `table` | true | false | `0.15380693972110748` | `0.1463223397731781` | `0.09632234275341034` |
| `det0-v0-test-table-000301-f008` | `table` | true | false | `0.20005758106708527` | `0.10536089539527893` | `0.07036090642213821` |

## Future Check Design

The next slice should run one no-training held-out behavior check over the
existing M3AE-AL receipt only. It should not load tensors, train, mutate the
packet, export, or promote anything. It should parse
`training.row_level_predictions`, `training.metrics`, and
`median_baseline_comparison` from the M3AE-AL receipt and emit a new receipt
that answers these questions:

1. At the fixed M3AE-AL threshold `0.5`, which validation/test rows are false
   positives, false negatives, true positives, and true negatives?
2. Do non-table held-out rows receive systematically higher presence scores than
   table rows, indicating an inverted or signer/split-specific presence signal?
3. For present table rows, does the microprobe beat or lose to the M3AE-AJ
   median constant box on MAE and IoU by split and by row?
4. Are the worst box errors concentrated on the same rows as table false
   negatives?
5. Does any report-only threshold sweep expose a coherent threshold band, or
   does threshold behavior remain contradictory because validation non-table
   false positives score around `0.91` to `0.94` while missed table rows score
   around `0.15` to `0.30`?
6. Is the failure best classified as architecture/optimization, data/schema,
   or a reduced-claim stop condition?

## Future Check Inputs

The future check must use only:

- M3AE-AL receipt row-level predictions and split metrics;
- M3AE-AJ median-baseline metrics for validation/test comparison;
- current packet row IDs, labels, splits, signer hashes, and tensor hashes as
  already recorded in M3AE-AL;
- Tier 0 manifest and source-register hashes for provenance binding.

It must not use tensors, images, generated labels, pretrained detectors, remote
compute, or any new source evidence.

## Pass And Stop Gates

The future held-out behavior check may select a later crop-normalization
ablation design only if all fixed-threshold gates pass:

```text
validation_presence_accuracy >= 0.80
test_presence_accuracy >= 0.80
validation_false_positive_count <= 1
validation_false_negative_count <= 1
test_false_positive_count <= 1
test_false_negative_count <= 1
validation_present_box_mae <= validation_m3ae_aj_median_box_mae
test_present_box_mae <= test_m3ae_aj_median_box_mae
validation_present_box_mean_iou >= validation_m3ae_aj_median_box_mean_iou
test_present_box_mean_iou >= test_m3ae_aj_median_box_mean_iou
row_level_error_table_recorded == true
threshold_sweep_reported_without_selecting_product_threshold == true
no_training_or_export_boundaries_preserved == true
```

The current M3AE-AL metrics do not meet these gates. The check is still useful
because it can close the held-out evidence under a no-training receipt and
choose the right remediation without rerunning a model.

The future check must select `detector0_union_target_architecture_remediation`
if the current pattern remains:

- validation/test fixed-threshold presence accuracy below `0.80`;
- table rows are missed while non-table rows receive high scores;
- validation/test box MAE and IoU lose to the M3AE-AJ median box; and
- no packet/tensor/schema inconsistency is found.

It must select `detector0_union_target_data_or_schema_remediation` only if it
finds concrete evidence that row labels, split assignment, target presence,
tensor hashes, target boxes, or schema semantics invalidate the held-out
comparison.

It must select `stop_reduced_claim` if the only honest continuation would
require human sign/data review, new source approval, Brev spend, generated
labels, pretrained detectors/landmarks, or a weakened product claim.

## Threshold Handling

The future check may report a threshold sweep over existing presence scores in
increments such as `0.05`, but it must not select or promote a threshold. A
threshold sweep is diagnostic only. If fixed-threshold behavior fails and only a
post-hoc threshold improves one split while harming another, the next action is
architecture remediation, not crop-normalization ablation.

## Boundaries

```text
design_only=true
microprobe_rerun=false
detector0_training=false
generic_training_smoke_retry=false
gradient_updates=0
packet_mutation=false
rows_added=false
brev_spend=false
brev_stop=false
brev_sync=false
brev_training=false
duplicate_brev_worker=false
crop_normalization_ablation=false
recognizer_training=false
label_expansion=false
controlled_clip_heldout_evaluation=false
source_approval=false
unapproved_media_import=false
generated_pseudo_label_use=false
pretrained_detector_or_landmark_use=false
onnx_export=false
model_card_promotion=false
final_readiness_claim=false
final_gate_weakening=false
product_runtime_code_change=false
push=false
```

## Brev Boundary

Read-only inventory only:

```text
brev_command=brev ls --json
workspace=asl-pilot-rawframe-001
workspace_id=2hl1hytty
status=RUNNING
build_status=COMPLETED
shell_status=READY
health=HEALTHY
gpu=A100
compute_used=false
remote_training_used=false
planned_remote_command=none
max_runtime_minutes=0
max_spend_usd=0
human_spend_approval=false
manual_stop_command=brev stop asl-pilot-rawframe-001
manual_stop_command_run=false
```

## Final-Promotion Blocker Separation

This design does not affect final promotion gates:

```text
hard_negative_far_assessed=false
no_zero_accepted_true_class_assessed=false
threshold_selected=false
onnx_export=false
model_card_promotion=false
final_readiness_claim=false
final_gate_weakening=false
final_promotion_negative_challenge_blocker=unchanged and separate from this design-only held-out behavior check plan
```

## Decision

The selected next action is:

```text
detector0_union_target_heldout_behavior_check
```

This is justified as one future no-training analysis receipt over the existing
M3AE-AL row-level predictions. It is not authorization for crop-normalization
ablation, recognizer training, export, promotion, final readiness, source
expansion, Brev compute, or product-runtime changes.
