# Dataset Source Evidence

Date: May 20, 2026

This note records the current public-source review used by
`docs/model/dataset-source-register.json`. It is not a legal approval memo. The
machine-readable register remains the controlling gate for training and final
manifests.

## Decision

The default training source is first-party consented browser capture. Public ASL
datasets are research references only until a specific external-rights review
approves the exact ASL Pilot use and binds that approval to hash-pinned evidence
files.

Current retained research receipts live at
`docs/research/dataset-source-research-receipts.json`. They record the checked
URL, final URL, HTTP status, content hash, normalized text hash, and matched
constraint IDs for the public-source decisions below. Each matched constraint
also keeps a short bounded source-text excerpt plus excerpt hash for human
review without retaining whole source pages. Refresh and audit them with:

```sh
node scripts/refresh_dataset_source_research.mjs --write
node scripts/audit_dataset_source_research.mjs
node scripts/audit_source_register.mjs
```

| Source | Current Decision | Primary Evidence |
| --- | --- | --- |
| ASL Citizen | Blocked for model training, validation, and pilot submission by default. | Microsoft Research license limits materials to non-commercial, non-revenue-generating research and bars distribution of data or data modifications. Source: <https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/> |
| WLASL | Blocked for model training, validation, and pilot submission by default. | The project documentation limits use to academic/computational purposes and says commercial usage is not allowed. Source: <https://github.com/dxli94/WLASL> |
| ASL-LEX | Blocked for model training, validation, and pilot submission by default. | The database/visualization are non-commercial, while sign reference videos are excluded and require explicit permission for other use. Source: <https://asl-lex.org/download.html> |
| PopSign ASL v1.0 original game videos | Approved for model training, validation, and pilot submission with attribution. | Official source evidence verifies CC BY 4.0 terms, original raw-video download archives, participant public-use consent framing, signer-disjoint train/validation/test splits, and 95/95 canonical vocabulary coverage. Source: <https://signdata.cc.gatech.edu/view/datasets/popsign_v1_0/> |
| Kaggle/static ASL datasets | Blocked as a family-level default. | Provenance, signer consent, redistribution rights, and task fit vary by dataset, so each candidate must be added as its own source-register entry with external-rights review before any allowed use. |

## Mechanical Gate

The source register audit now requires:

- a declared deny-by-default public dataset policy
- a strict source-kind enum
- unique `source_id` and `decision_id` values
- source evidence for every decision
- the first-party consent form hash for the built-in first-party source
- `review_required_before_allowing: true` for every non-first-party source
- hash-verified review receipts and license evidence files before any
  non-first-party source can be marked allowed
- retained public-source research receipts bound from
  `docs/model/dataset-source-register.json`

Training validation also rejects duplicate source IDs and any allowed
non-first-party source that lacks the approved external-rights review receipt.
For PopSign, the allowed path is external raw-video import: manifests must bind
to the approved source register and source audit, preserve source splits, and
decode RGB frames directly from original video files.
