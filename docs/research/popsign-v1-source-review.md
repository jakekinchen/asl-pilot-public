# PopSign v1 Source Review

Date: May 20, 2026

This review approves PopSign ASL v1.0 original game-category videos as an
external raw-video source for the ASL Pilot training and validation pipeline.
It is an engineering source-rights and provenance review, not legal advice.

## Decision

Approved source ID: `popsign-v1-original-videos`

Allowed scope:

- model training from raw RGB video clips
- signer-disjoint validation and test manifests
- pilot submission artifacts that cite and attribute PopSign ASL v1.0
- browser inference artifacts derived from randomly initialized ASL Pilot models

Required restrictions:

- use only PopSign v1 `game` original video archives from the official download API
- do not use preview videos from the website
- do not use OpenPose, MediaPipe, landmark, embedding, or other derived feature artifacts
- retain CC BY 4.0 attribution and cite the PopSign ASL v1.0 paper in model-card and pilot documentation
- keep source signer IDs pseudonymous in ASL Pilot manifests
- keep train, validation, and test signer splits aligned to the PopSign source splits

## Evidence

The retained machine audit is `docs/research/popsign-v1-source-audit.json`.
It verifies the official source card, download guide, and NeurIPS abstract.

Key findings:

- official source card declares CC BY 4.0
- official source card declares video as the primary modality
- official source card declares 250 signs and 47 signers
- official source card documents participant consent for a public-use dataset
- download guide exposes `train`, `val`, and `test` original video tar archives
- download guide says preview videos are not appropriate for reuse and directs users to original videos
- NeurIPS abstract documents 47 consenting Deaf adult signers
- NeurIPS abstract documents signer-disjoint train, validation, and test signer counts
- all 95 canonical ASL Pilot vocabulary labels map to PopSign v1 `game` signs

## Import Boundary

PopSign provides multiple artifact families. ASL Pilot may ingest only original
video archives under:

```text
https://signdata.cc.gatech.edu/data/popsign_v1_0/game/{train,val,test}/{sign}.tar
```

The raw-frame pipeline must decode RGB frames directly from extracted source
videos and must leave `derived_features` empty. Any path containing derived
pose, landmark, detector, embedding, feature-extractor, pretrained backbone, or
model-weight artifacts remains disallowed.
