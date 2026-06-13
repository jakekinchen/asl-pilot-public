# Dataset Source Register

No source may enter training until every required field is filled.

Machine-readable source decisions live in
`docs/model/dataset-source-register.json`. Training manifests must include the
path and SHA-256 hash of that JSON file, and the training/evaluation/export
promotion path rejects manifests that are not bound to a valid source register.
The public-source deny-by-default decisions are backed by retained research
receipts in `docs/research/dataset-source-research-receipts.json`; refresh them
with `node scripts/refresh_dataset_source_research.mjs --write` and audit them
with `node scripts/audit_dataset_source_research.mjs`.

| Source | Allowed For Production Training? | Reason | Required Before Use |
| --- | --- | --- | --- |
| First-party consented browser recordings | Yes, after review | Best match for PDF constraints, privacy expectations, and deployment environment. | Consent form, operator-controlled signer ID, split assignment, sanitized capture settings, label review, clip hash verification. |
| ASL Citizen | No, unless separately licensed | Microsoft Research license is non-commercial / non-revenue research only and restricts distribution of data/modifications. | Written permission for this pilot's exact use case and redistribution/model-output terms. |
| ASL Citizen - noncommercial school assignment raw videos | Yes, for this assignment only | The current user clarified this is a noncommercial school assignment. The approved scope is local raw-RGB training/validation only, with no raw-video, modified-video, extracted-frame, or local-mirror redistribution. | Use source ID `asl-citizen-school-assignment-raw-videos`; keep data under ignored `data/external/asl-citizen/`; cite ASL Citizen; destroy personal-data-bearing local files at research completion unless freshly reviewed. |
| WLASL | No | Project docs describe academic/computational use only, no commercial usage, unstable source videos, and unknown consent provenance. | Legal review plus clip-level consent/license clearance. |
| WLASL - noncommercial school assignment raw videos | Yes, for this assignment only | The current user clarified this is a noncommercial school assignment. The approved scope is local academic/computational raw-video training/validation only. | Use source ID `wlasl-school-assignment-raw-videos`; use only original raw source clips; ignore `bbox`, keypoints, pretrained weights, crops, and feature artifacts; probe URL availability before import. |
| ASL-LEX videos | No | Useful lexical reference, but videos have stricter personal-search-only usage terms. | Permission from rights holder for model training and product use. |
| PopSign ASL v1.0 original game videos | Yes, with attribution and raw-video-only import | Official source card declares CC BY 4.0, video modality, 250 signs, 47 signers, and public-use consent framing; the source audit verifies every mapped `game/{train,val,test}/{sign}.tar` archive for the 95-label vocabulary. | Preserve CC BY attribution, keep PopSign source splits, use only original game video archives, and reject preview/pose/landmark/feature artifacts. |
| Kaggle/static ASL datasets | No by default | Often unclear provenance, signer consent, and license quality. | Dataset-by-dataset license review, consent provenance, and label QA. |

The two school-assignment source IDs do not replace the general blocked ASL
Citizen and WLASL decisions. They are narrow, noncommercial, local-use decisions
for the present assignment only. Do not reuse those source IDs for commercial,
public-product, hosted-dataset, or redistributed-data work.

The PopSign approval is bound to
`docs/research/popsign-v1-source-audit.json`,
`docs/research/popsign-v1-source-review.md`, and
`docs/research/popsign-v1-external-rights-review-receipt.json`. It is an
engineering source-rights/provenance decision, not legal advice. The approval is
limited to PopSign v1 original `game` archives and does not allow OpenPose,
MediaPipe, preview, landmark, embedding, detector, feature, pretrained model, or
other derived artifacts into the ASL Pilot recognition path.

## Required Clip Metadata

- clip ID
- source ID
- source license decision
- signer ID
- signer registry record with deterministic split assignment
- operator-issued signer alias record
- signer consent record
- consent form version and consent form hash
- consent signed date
- label ID
- label reviewer
- capture browser and coarse camera characteristics
- sanitized `MediaStreamTrack.getSettings()` output only; do not retain persistent `deviceId` or `groupId`
- lighting/framing notes
- train/validation/test split
- checksum

## Required Consent Fields

- signer ID
- signer age/eligibility confirmation
- consent version
- date signed
- allowed use for model training
- allowed use for validation/testing
- allowed use in pilot submission/demo
- raw clip storage location
- who may access raw clips
- retention period
- deletion/withdrawal process
- whether derived trained model artifacts may be retained/shared after withdrawal
- whether clips may be redistributed
- whether de-identified metadata may be retained

The implemented consent form is documented in
`docs/privacy/dataset-consent-form.md`. The local collection store records the
consent version/hash, signed timestamp, operator user ID, storage/access
metadata, redistribution decision, de-identified metadata retention decision,
and a signer registry record for every alias used in collection.

## Collection Readiness Audit

Before collecting, generate an operator capture plan:

```sh
node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json
```

The planner selects signer aliases that satisfy the same deterministic
signer-disjoint split function used by manifest export. By default it targets
20 signers: 12 train, 4 validation, and 4 test. It assigns every missing
vocabulary label to a signer in the required split so collection can proceed
without guessing which alias will land in which split.

Before exporting manifests, run:

```sh
node scripts/plan_dataset_collection.mjs --summary-only
node scripts/audit_clip_review.mjs
node scripts/audit_challenge_review.mjs
node scripts/audit_dataset_collection_readiness.mjs
```

This audit reads the local collection store and reports:

- whether the store exists;
- total collected clips and valid clips;
- signer counts in train, validation, and test splits;
- whether signer-disjoint split counts meet the minimum 12 train, 4 validation, and 4 test signers;
- clip counts in each split;
- label coverage missing from each split;
- missing or incomplete consent records;
- missing signer registry records or signer registry split mismatches;
- missing approved clip-level ASL label review;
- missing approved negative challenge review;
- underfilled empty-camera, no-hands, low-light, or off-center challenge coverage;
- non-WebM clips, missing files, SHA-256 mismatches, file-size mismatches, or invalid clip durations;
- disallowed persistent camera settings such as `deviceId` or `groupId`.

It exits non-zero until collection is ready for manifest export.
