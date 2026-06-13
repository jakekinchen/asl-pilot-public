# Return-To-Form Tier 0 Detector 0 Table Second-Hand Candidate Packet Review V1

Mission: M3AE-Y Detector 0 table second-hand candidate packet review.
Generated: 2026-05-26T02:13:01Z.
Status: `candidate_review_complete`.

## Purpose

This artifact reviews one bounded set of additional `table`
`right_or_second_hand` candidate rows from already approved Tier 0 PopSign
manifests. It is a candidate-review receipt only. It does not mutate the
approved Detector 0 packet, mark candidate rows as approved annotations, train
Detector 0, train the recognizer, rerun the crop-normalization ablation, import
or approve sources, use Brev compute, export ONNX, promote a model card, weaken
final gates, or claim readiness.

## Source Artifacts

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-X design artifact | `docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md` | `ef9b84fd891c6e69e91259f26059a7ce69f0b75f1e3f860673551eea2b3f2717` |
| M3AE-W optional-target remediation | `docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json` | `ab42d0f02b037fafde3e5299d513a4b671b685e83bf1d9654d23cd89f2a6783a` |
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

Selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Packet Unchanged Proof

| Check | SHA-256 |
| --- | --- |
| packet before candidate review | `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34` |
| packet after candidate review | `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34` |

The approved packet was not edited. The three existing reviewed `table`
`right_or_second_hand` positive rows remain the only approved packet positives:

| Split | Row | Review status |
| --- | --- | --- |
| train | `det0-v0-train-table-000376-f010` | `manual_corrected` |
| validation | `det0-v0-validation-table-000376-f005` | `manual_verified` |
| test | `det0-v0-test-table-000286-f005` | `manual_verified` |

Candidate rows below are not approved annotations and are not packet rows.

## Evidence Inspected

Every candidate row below was reviewed from existing committed evidence only:

- `rgb_regions` tensor payload, `full_frame_reference` region, frame index
  listed in the row;
- retained table contact sheet
  `docs/validation/return-to-form-tier0-remediation-contact-sheets/table.png`;
- temporary local overlays rendered from the manifest-bound tensor paths under
  `/tmp/asl-pilot-table-candidate-review/`, used only as inspection aids and
  not tracked as source evidence.

No raw media import, new source approval, pretrained detector, pretrained
landmark, pretrained feature, or generated pseudo-label source was used.

## Candidate Rows

All rows have `label_id=table`, `source_id=popsign-v1-original-videos`,
`allowed_for_model_training=true`, and source register SHA-256
`b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`.

### Train

| Candidate | Clip | Source record | Source video SHA-256 | Signer hash | Frame | Time sec | Tensor path | Tensor file SHA-256 | Tensor digest SHA-256 | Evidence | Left/first hand box | Right/second hand box | Status |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| `cand-train-table-000379-f008` | `popsign-v1-train-table-000379` | `popsign_v1_0/game/train/table/4a.7003-table-2022_12_27_09_26_53.197-0.mp4` | `930aadfca7ab769c7155bdb5aca35585edd4c295a322f93b9f7aaffecf0123b7` | `7c01a9b7c2b20c7f1bb084d66ac6e7a2967d08a093077b9497d55131a1cd67bc` | 8 | 0.667 | `../../tensors/return-to-form-tier0/train/popsign-v1-train-table-000379-regions.pt` | `98f1f427ab617922bf0f51197c03979ba550ae387056c4c00dcb433ab641a129` | `a2d5cb39e25b9417620e8f3bddf3d1c4c4af7bc1c1d261dac4ac5412868ee0f3` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.12, 0.48, 0.52, 0.66]` | `[0.42, 0.49, 0.82, 0.67]` | `candidate_manual_corrected` |
| `cand-train-table-000386-f008` | `popsign-v1-train-table-000386` | `popsign_v1_0/game/train/table/4a.8027-table-2023_01_12_13_05_43.195-0.mp4` | `ae33e34ddc2e6ab5022f569eb78e3ae13fe9d1c37df05651e0288742e24fa7d7` | `44621e6a463f815358059025e7e5bc52a10856d5f4ec9c7ff63b47bf468a4a95` | 8 | 0.667 | `../../tensors/return-to-form-tier0/train/popsign-v1-train-table-000386-regions.pt` | `6670e588f90dc7e50c7dfa7f42e2857fe0367509eff8347d039e4b4e7110d6f6` | `f1c0cd81b1eb98dcb2fd9732aad35cce7eb7bcfe19a5e65368751bacc32d8b87` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.10, 0.50, 0.52, 0.70]` | `[0.40, 0.50, 0.82, 0.70]` | `candidate_manual_corrected` |
| `cand-train-table-000391-f010` | `popsign-v1-train-table-000391` | `popsign_v1_0/game/train/table/4a.8054-table-2023_02_10_23_22_08.360-0.mp4` | `23b1ca6746f685c1861937e7a9dc9a9199c21310d8694b5e79c7c0d3a5cdef27` | `abc0cb7ba434779fb8887fd3ea3e91f33ab9618955dc3490ae87a330fd93a934` | 10 | 0.833 | `../../tensors/return-to-form-tier0/train/popsign-v1-train-table-000391-regions.pt` | `df0d0754637182018c296165632beea1ee7a68974e61360c48c07ecdba5eec88` | `c0176010624fc5293ba988ae30bcb7de2ad62ae0f5006df1349ff2426703b51f` | `full_frame_reference:f010; table_contact_sheet; local_overlay` | `[0.15, 0.58, 0.50, 0.76]` | `[0.42, 0.58, 0.78, 0.76]` | `candidate_manual_corrected` |
| `cand-train-table-000392-f008` | `popsign-v1-train-table-000392` | `popsign_v1_0/game/train/table/4a.8902-table-2023_01_28_20_25_36.429-0.mp4` | `2fc457b148191e67ffce59340ccf0e486621bb1906cd51027bab2b0e036478cd` | `e8bbaa928eea9108f1951bea43e7ee4ccaeddc447f289c3cb54452a3f768cfe2` | 8 | 0.667 | `../../tensors/return-to-form-tier0/train/popsign-v1-train-table-000392-regions.pt` | `4f5add3b28dc914895b06459fdae6077f4e362e5f67af788a5c20290a57b4f6d` | `cd919efa871c0b51e49272ac4217ed4dbe4617a2edef9fb08fd16d6fc6fa1d3b` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.18, 0.55, 0.52, 0.72]` | `[0.44, 0.55, 0.78, 0.72]` | `candidate_manual_corrected` |
| `cand-train-table-000396-f008` | `popsign-v1-train-table-000396` | `popsign_v1_0/game/train/table/gtsignstudy4a.7042-table-2023_01_27_10_03_20.667-0.mp4` | `a85d638fde484ac24e34ded8c24a6e6a1ddf0b0e0db99dc29a02b975c1a1724b` | `d2fe031922f8146aa2014806244311a9fbf8e1e21d30e6effe10670b8e5afa4e` | 8 | 0.667 | `../../tensors/return-to-form-tier0/train/popsign-v1-train-table-000396-regions.pt` | `97b2265269cf86c2fa7961faf8f1a326c95d3d2098a74c38cd02a34b0b73a3fb` | `0a5b9e5ce479fe1105c69652823be19bceffac85e8e06380c817365991725b8e` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.20, 0.42, 0.54, 0.60]` | `[0.46, 0.42, 0.80, 0.60]` | `candidate_manual_corrected` |
| `cand-train-table-000400-f008` | `popsign-v1-train-table-000400` | `popsign_v1_0/game/train/table/gtsignstudy4a.8048-table-2023_01_27_15_14_30.216-0.mp4` | `bd3f17b0f86abd7ef2c9b0f56eb788514e608a0ecb2b137978f5d69ec3c324d8` | `dfbc221302a2da2fa433035916d9b200bb7090083a544b69469a1aec7d836a87` | 8 | 0.667 | `../../tensors/return-to-form-tier0/train/popsign-v1-train-table-000400-regions.pt` | `14e9995b4aeb93158c602e2ee036207b5b6000ce9f24f1339d972c1e1a8afbea` | `dd1cbfccc0ca2173912736ca9007bf7b533750eb745030d7cd8ae381c0be06c3` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.14, 0.46, 0.50, 0.64]` | `[0.42, 0.46, 0.78, 0.64]` | `candidate_manual_corrected` |

### Validation

| Candidate | Clip | Source record | Source video SHA-256 | Signer hash | Frame | Time sec | Tensor path | Tensor file SHA-256 | Tensor digest SHA-256 | Evidence | Left/first hand box | Right/second hand box | Status |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| `cand-validation-table-000379-f008` | `popsign-v1-validation-table-000379` | `popsign_v1_0/game/val/table/4a.8005-table-2022_12_15_16_59_45.185-0.mp4` | `2f87c2f38f12ff23bbdb47b57d460845cef7980d8f40ad7e8bbfab12fa0fc102` | `cc50a89882a8ed4c0982ee9170fb302bc1bbbb5e94e893bce3b0632118cc0cf8` | 8 | 0.667 | `../../tensors/return-to-form-tier0/validation/popsign-v1-validation-table-000379-regions.pt` | `2edb6d3ace5bcf43f14cca7263b0f139480cd9ff42459bb09b9f273550e3b4c9` | `ab5f95c147c00c0d545333f18173dc9fd3a3bd327f9a9faee6ca66ab41f7278a` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.16, 0.46, 0.52, 0.64]` | `[0.44, 0.46, 0.80, 0.64]` | `candidate_manual_corrected` |
| `cand-validation-table-000383-f010` | `popsign-v1-validation-table-000383` | `popsign_v1_0/game/val/table/4a.8013-table-2023_01_11_16_56_51.795-0.mp4` | `140516cccc93acdeae853e422b884c6e85f2b920bac49a0aaf3cc3b73a1c7964` | `54ed19eb670a7fc395dbc28c6820b933d1eede5e2fcb97d9ea70c49c654682d8` | 10 | 0.833 | `../../tensors/return-to-form-tier0/validation/popsign-v1-validation-table-000383-regions.pt` | `e0f8f078450999352c971a1a917239180b5edd7677a7673596f08f74f40095b1` | `fc67967a5408178b798e9f6b9b6b33c98c0a7e58e8cd84b6960be99c2cf7f17a` | `full_frame_reference:f010; table_contact_sheet; local_overlay` | `[0.16, 0.50, 0.54, 0.68]` | `[0.44, 0.50, 0.82, 0.68]` | `candidate_manual_corrected` |
| `cand-validation-table-000385-f008` | `popsign-v1-validation-table-000385` | `popsign_v1_0/game/val/table/4a.8015-table-2023_01_28_01_59_16.096-0.mp4` | `01a8b67e716a6235b7546bdc17cd85350514aa2713ca762e5844117247874950` | `fb6c9cc349eb6ba8c064cb7572615613c07e91211a75a97f3bc95bc91848d39a` | 8 | 0.667 | `../../tensors/return-to-form-tier0/validation/popsign-v1-validation-table-000385-regions.pt` | `1bde07ea157d9bc597b3b5bb9b2bdd332145f1477fdedb7a2bfa74059b16e8f1` | `a80706534ff979e86b90c3aa8fb0c28470e2451c7a86c3a34531b35c7ca24d3d` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.10, 0.48, 0.52, 0.66]` | `[0.42, 0.48, 0.82, 0.66]` | `candidate_manual_corrected` |
| `cand-validation-table-000388-f008` | `popsign-v1-validation-table-000388` | `popsign_v1_0/game/val/table/4a.8018-table-2023_01_10_18_35_17.729-0.mp4` | `f640ff70571ad469deaae25c8e8c5e69a251006a4f9b4b4e0fa9cc4ffe4495d7` | `96a654d6be5c2506b495f010339ce766ebd64a54096a79fe00b9bbc3ce1c280b` | 8 | 0.667 | `../../tensors/return-to-form-tier0/validation/popsign-v1-validation-table-000388-regions.pt` | `414a9f343f27bb08832ea51f462ba1b3e88dc336679b39fdb8cfd4b52439a2e9` | `a0885f32bbd1835636615f5009aafc832c5218d0a6a26910d97e986502d94361` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.20, 0.48, 0.54, 0.66]` | `[0.44, 0.48, 0.78, 0.66]` | `candidate_manual_corrected` |
| `cand-validation-table-000393-f008` | `popsign-v1-validation-table-000393` | `popsign_v1_0/game/val/table/4a.8025-table-2023_01_12_23_52_10.159-0.mp4` | `bfee65c2b234c6dd867812eec89cba8703c7a58977eb6d4613fca988a9023398` | `30132f3fd3bc05eda5a491afa1802072649326f4a39e6a24ba7f2351b841f4a5` | 8 | 0.667 | `../../tensors/return-to-form-tier0/validation/popsign-v1-validation-table-000393-regions.pt` | `932270232659dab4c37fce151b39ea596b78b19622802916dea52089eda06e61` | `20d1bbb92a65f84bcfd132568435ecb4b6f2f7e606f8f3d5cfd4d477df7d699d` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.15, 0.52, 0.54, 0.70]` | `[0.45, 0.52, 0.84, 0.70]` | `candidate_manual_corrected` |
| `cand-validation-table-000397-f008` | `popsign-v1-validation-table-000397` | `popsign_v1_0/game/val/table/4a.8051-table-2023_01_29_20_41_28.906-0.mp4` | `c1ad9949a2d5e9415c585bd3b1a83c164773f2ce5d703a706f61ef548c65fc2c` | `d634581037b96d18388590532350e015fadb5d4e0891aa20e59c1731d7bfb9ee` | 8 | 0.667 | `../../tensors/return-to-form-tier0/validation/popsign-v1-validation-table-000397-regions.pt` | `2351eca5272b6b264f99116c596ae3484e4c5239d6249ae8e1c383dee6448491` | `d1ec08775b1057062450026cfdb802cf14254da34ca03cefd26304258f7b97e2` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.22, 0.52, 0.54, 0.70]` | `[0.46, 0.52, 0.78, 0.70]` | `candidate_manual_corrected` |

### Test

| Candidate | Clip | Source record | Source video SHA-256 | Signer hash | Frame | Time sec | Tensor path | Tensor file SHA-256 | Tensor digest SHA-256 | Evidence | Left/first hand box | Right/second hand box | Status |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| `cand-test-table-000288-f008` | `popsign-v1-test-table-000288` | `popsign_v1_0/game/test/table/gtsignstudy4a.8032-table-2023_01_27_17_21_44.663-0.mp4` | `15732cfc735d9502a7acb529d8d2d6e87d0a57658d72d9a3309b68a55aa44c9b` | `dea2b45d14f9aa79f926bb30c35ac5280848249c9268afedb27088d019cb2e25` | 8 | 0.667 | `../../tensors/return-to-form-tier0/test/popsign-v1-test-table-000288-regions.pt` | `872eefcb3a18a24411bce0d34ac5ed22d1c331f92adfb33e495a67a3e4796fd1` | `9ac2c2d486fc8b0a00d45b0173e29a7f06593431fc2b07aec2fafa8a2b933848` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.24, 0.46, 0.54, 0.64]` | `[0.46, 0.46, 0.78, 0.64]` | `candidate_manual_corrected` |
| `cand-test-table-000290-f008` | `popsign-v1-test-table-000290` | `popsign_v1_0/game/test/table/gtsignstudy4a.8033-table-2023_01_28_23_51_45.129-0.mp4` | `3b043a24b7c510e7eafb08624eecf7ec75f90d084197745cc9b24389fb8959c1` | `4027e4c04fcfc2940fe00c6d89cf00633df9a37b921346a77c9c4c2bd29e69fb` | 8 | 0.667 | `../../tensors/return-to-form-tier0/test/popsign-v1-test-table-000290-regions.pt` | `af3a27c5c1567864c372ddd1cd9af3dfc93d4b78a44e4e05885cae477696668e` | `2d8d8d24f65483fe4e35562db2bf406f668899214d5b287f6e50d64f3dd1012f` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.20, 0.44, 0.54, 0.62]` | `[0.46, 0.44, 0.82, 0.62]` | `candidate_manual_corrected` |
| `cand-test-table-000294-f008` | `popsign-v1-test-table-000294` | `popsign_v1_0/game/test/table/gtsignstudy4a.8035-table-2023_01_26_17_05_59.415-0.mp4` | `26141058b597f68db7851846759bb297c8f8c28c0ada492e070b2fca4e1ce65b` | `0a4c034271536723f6b9253752108a6bba85a26dea7185e2c8c25eea2493b920` | 8 | 0.667 | `../../tensors/return-to-form-tier0/test/popsign-v1-test-table-000294-regions.pt` | `e642500d9eaf5f1d0e67f707775722a2340318ed713e2ac2c68602ad21425d73` | `cbdb8f62c3760273812bc9580089f5fa0cd27efd8f7bcdb366e49e168eabcccf` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.12, 0.50, 0.52, 0.68]` | `[0.42, 0.50, 0.82, 0.68]` | `candidate_manual_corrected` |
| `cand-test-table-000297-f008` | `popsign-v1-test-table-000297` | `popsign_v1_0/game/test/table/gtsignstudy4a.8036-table-2023_01_25_19_21_54.801-1.mp4` | `f943453199b72e39ed0a331da3d092022eb9ea56468ce9d3acdef1233ca70ba2` | `3660c753560b193daec1e61e3060fb0d2cab427ab3b6760f545fbc9f682c896b` | 8 | 0.667 | `../../tensors/return-to-form-tier0/test/popsign-v1-test-table-000297-regions.pt` | `840ed1575a06f701d2abbd937e74ece15ca68e00324232a282843d5cf00b1877` | `19cc1e6b283c9e202dc6d3abc05b3115b3a5b07e49b47c3d2097ddcfdd781672` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.30, 0.52, 0.56, 0.70]` | `[0.48, 0.52, 0.78, 0.70]` | `candidate_manual_corrected` |
| `cand-test-table-000301-f008` | `popsign-v1-test-table-000301` | `popsign_v1_0/game/test/table/gtsignstudy4a.8037-table-2023_01_25_17_13_26.906-0.mp4` | `4b58133a851b7fd21b3a475aa6d977d0c4455b7ed94f0e2f6a62c4eb4c7f549a` | `abb19b30e7af50c6cc238bd1d5ca897512d0c3a063d48bba12e78189ecfecdd0` | 8 | 0.667 | `../../tensors/return-to-form-tier0/test/popsign-v1-test-table-000301-regions.pt` | `4ffeee0355b861344fa421614442276aca781e6e6438ae6353dbd43e3411a569` | `5082df3e2166aec169ac6759f7111500fc096811a0ba61a59811de36559a4c75` | `full_frame_reference:f008; table_contact_sheet; local_overlay` | `[0.20, 0.54, 0.52, 0.72]` | `[0.44, 0.54, 0.78, 0.72]` | `candidate_manual_corrected` |

## Review Counts And Target Status

| Split | Existing reviewed positives | New candidates reviewed | Candidate accepted | Candidate rejected | Total candidate-or-existing reviewed positives | M3AE-X minimum target |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| train | 1 | 6 | 6 | 0 | 7 | met |
| validation | 1 | 6 | 6 | 0 | 7 | met |
| test | 1 | 5 | 5 | 0 | 6 | met |

Candidate status distribution:

```text
candidate_manual_corrected=17
candidate_manual_verified=0
candidate_rejected_for_insufficient_visual_evidence=0
candidate_rejected_for_ambiguous_hand_identity=0
candidate_rejected_for_missing_provenance=0
candidate_rejected_for_duplicate_packet_row=0
```

The M3AE-X target is satisfied: each split now has at least five
candidate-or-existing reviewed positive rows available for a separate packet
mutation slice. No packet mutation is performed here.

## Baseline Comparison

M3AE-V policy-aware baseline remains unchanged:

```text
table_manifest_examples=69
table_expected_present_decisions=1104
missed_present_table_right_or_second_hand_count=928
missed_present_table_right_or_second_hand_rate=0.8405797101449275
gateable_per_target_fallback_rate_max=0.60
policy_aware_gate_status=failed
```

This review does not change the baseline. It only establishes a candidate pool
large enough for a later packet mutation slice to add more reviewed positives
before Detector 0 retraining or ablation rerun is considered.

## Boundaries

| Boundary | Status |
| --- | --- |
| Approved Detector 0 packet mutation | not performed |
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
| Push | not performed |

Final-promotion blockers remain unchanged and separate:
`tier0_hard_negative_far`, `no_zero_accepted_true_class`, full 17-type
negative-challenge coverage, threshold selection, ONNX export, and model-card
promotion are all still unresolved.

## Next Action

`detector0_table_second_hand_packet_mutation`

Rationale: the candidate review found enough candidate-or-existing reviewed
positive rows to meet the M3AE-X minimum target in train, validation, and test.
The next useful slice is a separate packet mutation step that may add selected
candidate rows to the approved Detector 0 packet with stable packet row ids and
full provenance. That future slice must still preserve no-pretrained/source
boundaries and must not train, rerun the ablation, export, promote, claim
readiness, weaken gates, use Brev compute, or push unless a later prompt
explicitly authorizes those actions.
