# NVIDIA ASL Access Request Packet

Checked at: 2026-05-25T16:31:00Z

This packet prepares the information needed for an NVIDIA ASL dataset access
request. It should not be treated as submitted access evidence.

## Status

Not submitted by Codex.

The NVIDIA form requires user- or organization-specific fields such as name,
business email, organization, industry, job title, country/location, preferred
language, license acceptance, and use case. Those fields need a human operator.

The retained metadata audit was rerun on 2026-05-25 and remains blocked on the
two expected post-access requirements:

- accepted access/license receipt:
  `docs/research/nvidia-asl-access-receipt.json`
- metadata-only staging directory:
  `artifacts/dataset-research/nvidia-asl/metadata/`

## Proposed Use Case

ASL Pilot is evaluating a browser-first, from-scratch raw-frame American Sign
Language recognition model for beginner isolated vocabulary practice. The
project will use only approved raw RGB video clips for training, validation, and
testing. It will not use hand landmarks, body poses, face meshes, extracted
feature caches, pretrained detectors, pretrained backbones, or model-zoo
weights in the recognition path.

The current approved PopSign-v1 route has real raw-video-backed manifests and
tensors, but the latest from-scratch Brev/A100 runs did not generalize:

- compact 3D 5-epoch probe: best validation `0.00968421052631579`
- motion 2D 35-epoch probe: best validation `0.0648421052631579`, final train
  `0.9953684210526316`
- clipnorm 3D 50-epoch candidate: best validation `0.06989473684210526`, final
  train `0.9103157894736842`

The retained recovery diagnostic
`docs/validation/rawframe-training-quality-recovery-diagnostic.json` classifies
the likely failure as split/source/signer generalization failure with training
memorization. NVIDIA access is therefore being pursued as a source-review path
for additional approved raw-video evidence, not as permission to bypass the
source register or import protected media directly into training.

The requested NVIDIA dataset access would be used first for metadata and source
review:

- inspect label vocabulary and overlap with the current 95-label ASL Pilot
  vocabulary;
- inspect signer and train/validation/test split metadata for leakage risk;
- confirm raw-video availability and file integrity;
- confirm license compatibility for local training, validation, browser ONNX
  inference, model-card documentation, and pilot submission artifacts;
- import raw video only after source-register approval.

No raw NVIDIA videos should be imported into ASL Pilot until the accepted
license/access receipt and local metadata audit are retained, and the ASL Pilot
source register approves the exact raw-video-only import scope.

## Required Commitments To Preserve

- Use the data only for ASL accessibility technology consistent with the
  accepted license.
- Do not redistribute NVIDIA data or make raw clips available outside authorized
  users.
- Do not identify, profile, or attempt to identify individuals in the data.
- Do not infer sensitive attributes from people in the data.
- Do not perform biometric processing or identity-recognition evaluation.
- Keep raw data copy provenance traceable.
- Honor any NVIDIA data subject deletion/correction request.
- Keep extracted images, hand landmarks, body poses, face meshes, pretrained
  models, detectors, and feature caches out of ASL Pilot's recognition path.
- Do not publish claims about the NVIDIA agreement beyond allowed attribution
  without approval.

## Questions To Resolve After Access

1. What labels are included, and how many overlap the current 95-label ASL Pilot
   vocabulary?
2. Are isolated sign clips already segmented and label-reviewed?
3. Are signer identifiers available for signer-disjoint split auditing?
4. Is a recommended train/validation/test split provided?
5. Are raw-video files available in a browser-decodable or FFmpeg-decodable
   format?
6. Are browser ONNX model artifacts and public model cards allowed outputs?
7. Are pilot submission artifacts allowed, and what attribution/no-publicity
   language is required?
8. Are there retention or deletion obligations that require additional ASL Pilot
   tooling before import?

## Post-Access Checklist

1. Save the final accepted license/access receipt under `docs/research/`.
2. Hash-pin any downloaded metadata package under `artifacts/dataset-research/nvidia-asl/`.
3. Use `docs/research/nvidia-asl-access-receipt.template.json` as the receipt
   shape for `docs/research/nvidia-asl-access-receipt.json`. The accepted
   receipt must include at least `status: accepted_access_retained`,
   `accepted_at`, `access_request_submitted_at`, `operator_name`,
   `operator_role`, `organization`, `access_request_reference`, `use_case`,
   at least one hash-pinned `evidence_attachments` item,
   `accepted_license_terms: true`, `accepted_trustworthy_ai_terms: true`,
   `raw_video_only_scope: true`, `no_redistribution: true`,
   `no_identity_or_biometric_processing: true`, and
   `no_pretrained_or_derived_recognition_components: true`.
4. Stage only metadata under `artifacts/dataset-research/nvidia-asl/metadata/`;
   do not place raw videos, extracted images, landmarks, pose files, face meshes,
   models, tensors, or feature caches in that directory.
5. Run `node scripts/audit_nvidia_asl_access_metadata.mjs --write` to create a
   fail-closed metadata audit with label counts, signer counts, split policy, and
   raw-video path inventory.
6. Draft an exact source-register entry only after the metadata audit supports
   the intended scope.
7. Keep NVIDIA data out of `data/manifests/`, `data/external/`, and
   `data/tensors/` until the source-register entry is approved.

## Current Audit Command

```sh
node scripts/audit_nvidia_asl_access_metadata.mjs --write
```

Expected status before accepted access evidence exists: `blocked` with blockers
for the missing accepted access receipt and metadata staging directory.
