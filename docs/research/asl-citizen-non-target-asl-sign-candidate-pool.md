# ASL Citizen non_target_asl_sign candidate pool

Checked at: 2026-05-24

## Status

Discovery-probe results only. Does not download or extract any raw clips, does not modify [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json) or any manifest, and does not satisfy final negative-challenge evidence. The probe used HTTP range requests against the published Microsoft download URL to inspect the ZIP central directory only (no media extraction).

This file unblocks `non_target_asl_sign` for the autonomous loop by demonstrating that the existing approved [`asl-citizen-school-assignment-raw-videos`](../model/dataset-source-register.json) source contains a substantial pool of off-active-module clips, far exceeding the 5-per-type minimum required by [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py) `MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE`.

## Approach

1. Authored [`docs/research/asl-citizen-non-target-candidate-labels.json`](asl-citizen-non-target-candidate-labels.json) — a 30-label candidate list of concrete ASL signs (nouns, transit, occupations, weather, body items) that are confidently NOT in the 95-label PopSign-v1 active recognition module per [`data/active-module/vocabulary-active-module.snapshot.json`](../../data/active-module/vocabulary-active-module.snapshot.json).
2. Re-ran the existing [`scripts/probe_asl_citizen_zip_index.py`](../../scripts/probe_asl_citizen_zip_index.py) with `--label-file=docs/research/asl-citizen-non-target-candidate-labels.json --output=docs/research/asl-citizen-non-target-zip-index-probe.json --write`.
3. Inspected the resulting `label_match_counts` and `matches` blocks.

The probe is the same one that previously inventoried 25 in-active-module labels (see [`docs/research/asl-citizen-zip-index-probe.json`](asl-citizen-zip-index-probe.json) and [`docs/session-logs/058-premise-correction-no-off-target-wlasl.md`](../session-logs/058-premise-correction-no-off-target-wlasl.md)) and confirmed all locally-imported ASL Citizen clips are in the active module.

## Findings

28 of 30 candidate labels match ASL Citizen at substantial volume (the probe is capped at `--max-matches-per-label 40`).

| Label | Match count | Notes |
| --- | --- | --- |
| `cloud` | 40 (capped) | filename pattern: `ASL_Citizen/videos/<id>-CLOUD.mp4` |
| `computer` | 40 (capped) | |
| `doctor` | 40 (capped) | |
| `door` | 40 (capped) | |
| `key` | 40 (capped) | |
| `money` | 40 (capped) | |
| `mountain` | 40 (capped) | |
| `pants` | 40 (capped) | |
| `river` | 40 (capped) | |
| `shirt` | 40 (capped) | |
| `snow` | 40 (capped) | |
| `window` | 40 (capped) | |
| `rain` | 31 | |
| `train` | 31 | |
| `bus` | 30 | |
| `fire` | 30 | |
| `flower` | 30 | |
| `ring` | 30 | |
| `star` | 30 | |
| `teacher` | 30 | |
| `boat` | 29 | |
| `nurse` | 29 | |
| `ocean` | 29 | |
| `moon` | 28 | |
| `music` | 28 | |
| `sun` | 28 | |
| `tree` | 28 | |
| `ball` | 27 | |
| `bike` | 0 | not in ASL Citizen under this gloss |
| `police` | 0 | not in ASL Citizen under this gloss |

Total candidate clip pool across 28 matched labels: 27 to 40 clips per label, with most labels at or near the 40-clip probe cap (the actual ASL Citizen pool is larger; the probe truncates).

## Implication

`non_target_asl_sign` has a **comfortable candidate pool** (well above the 5-per-type minimum) from the existing approved `asl-citizen-school-assignment-raw-videos` source. Five distinct labels (one clip each) — or fewer labels with multiple clips — easily satisfy the gate.

Per [`docs/research/wikimedia-commons-human-action-negative-challenge-source-discovery.md`](wikimedia-commons-human-action-negative-challenge-source-discovery.md):

> For the 5 ASL-domain types (`fingerspelling_like_motion`, `non_target_asl_sign`, `partial_sign`, `wrong_location`, `wrong_palm_orientation`), Wikimedia Commons is unlikely to be a natural source because the negative-challenge intent depends on knowing which signs are in the 95-vocab module. The plausible online path for these is to repurpose already approved training/validation sources — `popsign-v1-original-videos`, `asl-citizen-school-assignment-raw-videos`, `wlasl-school-assignment-raw-videos` — by selecting clips that are not in the 95-label PopSign vocabulary, and labelling them as `non_target_asl_sign`.

This probe demonstrates that the ASL Citizen path is viable.

## Recommended next slice (separate from this discovery write-up)

1. **Pick 5 distinct off-active-module labels** from the candidate pool above (suggested: `computer`, `door`, `key`, `money`, `tree` for variety across handshape + movement + location domains).
2. **Extract one clip per label** via HTTP range request using the existing probe's `local_header_offset` + `compressed_size` data; honor the existing decision-boundary constraint that raw clips stay out of git (use the existing `data/external/asl-citizen-school-assignment-raw-videos/raw/` directory pattern).
3. **Compute SHA-256 of each extracted .mp4** and confirm uniqueness vs. existing manifests.
4. **Visual review** to confirm each clip is the intended sign and contains no incidental active-module sign content.
5. **Extend [`scripts/export_online_negative_challenge_manifest.mjs`](../../scripts/export_online_negative_challenge_manifest.mjs)** (or equivalent) to add the 5 clips as `non_target_asl_sign` entries with: source-page URL (the ASL Citizen dataset page), original-file URL (Microsoft ZIP download URL + offset/length), license/terms evidence (existing `approved_asl_citizen_school_assignment_raw_videos_*` source-register decision), local raw-video path, SHA-256, and source-register decision-id.
6. **Re-run** `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json` to confirm `non_target_asl_sign` moves from underfilled to filled.

## Hard limits this research respects

- No raw videos were downloaded by this probe; the ZIP central directory is inspected via range requests only.
- No new source approval was introduced; the existing `asl-citizen-school-assignment-raw-videos` source-register decision already covers this scope.
- No active-module changes.
- No transformation of clips beyond what the existing rawframe-pipeline contract permits.
- The 17-type negative-challenge gate is not narrowed.
- No pose, landmark, embedding, detector, feature, or pretrained artifact is introduced.

## Open questions

- Whether one clip per label (5 distinct labels) suffices for the 5-per-type minimum, or whether the auditor expects 5 clips per label (which would mean a single `non_target_asl_sign` row from 5+ clips of one off-target label, or 5 clips total across labels). [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py) `MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE = 5` reads as "5 clips per type-category", not "5 per label" — so 5 distinct clips across any combination of off-target labels satisfies the gate. Confirm in the next slice.
