# WLASL Academic Source Review

Date: May 21, 2026

This review approves WLASL only for the current ASL Pilot noncommercial school
assignment, using raw source video clips as local training and validation data.
It is an engineering source-rights and provenance review, not legal advice.

## Decision

Approved source ID: `wlasl-school-assignment-raw-videos`

Allowed scope:

- local academic/computational raw-video training for this school assignment
- local noncommercial validation and error analysis
- pilot submission artifacts that do not redistribute raw videos, modified
  videos, extracted frames, or substantial dataset excerpts
- trained-from-scratch ASL Pilot model artifacts, if the submission remains
  academic/noncommercial and cites WLASL

Required restrictions:

- use only original raw source clips referenced by WLASL metadata
- do not use WLASL pretrained weights, pose outputs, body keypoints,
  bounding-box crops as model inputs, or any other derived CV artifact
- do not train from WLASL `bbox` values; they may be retained only as ignored
  source metadata for provenance/debugging
- prefer clips that are currently retrievable from direct video URLs; probe
  YouTube or third-party URLs before attempting download
- keep all downloaded media and metadata in ignored local storage under
  `data/external/wlasl/`
- do not redistribute raw clips, modified clips, extracted frames, or local
  mirrors of the dataset
- keep source signer identifiers pseudonymous in ASL Pilot manifests
- cite the WLASL paper/repository and retain the C-UDA/no-commercial-use
  limitations in reports

## Evidence

The WLASL repository describes the dataset as governed by the Computational Use
of Data Agreement, intended for academic and computational use only, and not
available for commercial usage. The retained local metadata file
`data/external/wlasl/metadata/WLASL_v0.3.json` contains 2,000 gloss classes and
21,083 source instances, including split, signer, source URL, and video ID
metadata.

The C-UDA permits computational use of received data under its terms and treats
AI models trained on data as results when they do not include more than a
de minimis portion of the data. This review does not override the WLASL
repository's no-commercial-use statement.

## Import Boundary

WLASL may enter ASL Pilot only as raw RGB source video decoded locally from the
original source clip URLs. The ASL Pilot recognition path must ignore WLASL
pretrained models, body keypoints, pose/landmark artifacts, bounding-box crops,
feature caches, or any other derived CV artifact.

The active import plan must start from exact normalized label overlap with the
current ASL Pilot vocabulary, then probe current URL availability and download
only the selected raw clips needed for the controlled pilot.
