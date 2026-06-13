# ASL Citizen Academic Source Review

Date: May 21, 2026

This review approves ASL Citizen only for the current ASL Pilot
noncommercial school assignment, using raw RGB video clips as local training
and validation data. It is an engineering source-rights and provenance review,
not legal advice.

## Decision

Approved source ID: `asl-citizen-school-assignment-raw-videos`

Allowed scope:

- local noncommercial, non-revenue school-assignment model training
- local noncommercial validation and error analysis
- pilot submission artifacts that do not redistribute raw videos, modified
  videos, extracted frames, or substantial dataset excerpts
- trained-from-scratch ASL Pilot model artifacts, if the submission remains
  noncommercial and documents the source limitations

Required restrictions:

- use only raw RGB videos from the official ASL Citizen download
- do not use pretrained baselines, pretrained checkpoints, pose outputs,
  landmark outputs, feature caches, or any derived CV artifact as model inputs
- do not redistribute raw clips, modified clips, extracted frames, or local
  mirrors of the dataset
- keep the dataset in ignored local storage under `data/external/asl-citizen/`
- keep source metadata and signer identifiers pseudonymous in manifests
- destroy local personal-data-bearing raw files and backups when the school
  research use is complete, unless a fresh review authorizes retention
- cite the ASL Citizen paper and Microsoft Research source page in reports

## Evidence

Official Microsoft Research materials state that ASL Citizen contains about
84,000 isolated-sign videos across about 2,700 ASL signs, captured in everyday
recording scenarios with consent and IRB approval. The project page gives an
official command-line ZIP download URL.

The Microsoft Research license limits use to noncommercial, non-revenue
research, allows use and modification of data only consistently with the
participant consent, bars distribution of data or modifications, and requires
personal data to remain confidential and be destroyed at completion of the
research.

## Import Boundary

ASL Citizen may enter ASL Pilot only as raw RGB source video decoded locally.
The no-pretrained/no-derived-CV rule still applies. Any pretrained baseline,
embedding, detector, pose, landmark, keypoint, optical-flow cache, or
feature-extractor artifact remains disallowed.

Because the official archive is very large, download/extract work must be disk
guarded. The active import plan must record the official archive URL, byte
size, local archive path, source-register decision ID, and whether the archive
has actually been downloaded and inspected.
