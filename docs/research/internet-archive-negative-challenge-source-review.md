# Internet Archive Negative Challenge Source Review

Checked at: 2026-05-25T01:00:00Z

## Status

This is an **exact-file source review** for the 10-item starting batch
from [`internet-archive-negative-challenge-probe-results.md`](internet-archive-negative-challenge-probe-results.md).
It captures the authoritative per-item `/metadata/<identifier>` evidence
(license URL, rights, creator, contributor, file list, raw-video derivative
selection, IA-supplied MD5) for each candidate so the next slice can make
an informed source-register decision.

This document does **not** itself approve any Internet Archive source.
Source-register approval, an external rights-review receipt, raw-video
download, exporter/downloader/contact-sheet/manifest extension, decode,
and the final-manifest audit re-run are explicitly out of scope and must
each land as their own subsequent slices.

The Internet Archive treats per-item `/metadata/<identifier>` as the
source of truth for `licenseurl` and the per-file derivative list (probe 5
in [`internet-archive-negative-challenge-probe-results.md`](internet-archive-negative-challenge-probe-results.md)
established that `/advancedsearch.php` returns `null` for the `rights`
field on Prelinger items, so the metadata endpoint must be consulted for
each approval).

## Scope

- Planned source id (not yet approved): `internet-archive-negative-challenge-videos`
- Allowed-for-training (if approved later): `false`
- Allowed-for-validation (if approved later): `true`
- Allowed-for-pilot-submission (if approved later): `true`
- Coverage intent: backfill the underfilled `hand_clap` (need +4 strong)
  and `hands_cropped_out` (need +1 strong) negative-challenge types only.
- Out of scope: the other 10 underfilled negative-challenge types, all
  positive-vocabulary training data, any landmark / pose / embedding /
  detector / feature / pretrained artifact.

## Evidence

Raw IA `/metadata/<identifier>` responses are pinned at:

- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-henry_wallace_speech.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-henry_wallace_speech.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-FreedomH1956.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-FreedomH1956.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-200768_The_Grand_Design_R2.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-200768_The_Grand_Design_R2.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-cnn-10-a-ballet-legend-takes-her-final-bow.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-cnn-10-a-ballet-legend-takes-her-final-bow.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-hurt_20260102_202601.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-hurt_20260102_202601.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-DateWith1950.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-DateWith1950.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-DaysofOu1955.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-DaysofOu1955.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-DayCalle1955_2.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-DayCalle1955_2.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-Darkness1955.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-Darkness1955.json)
- [`artifacts/research/internet-archive-negative-challenge-probes/metadata-EskimosW1950.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-EskimosW1950.json)

Each candidate was fetched via:

```text
GET https://archive.org/metadata/<identifier>
User-Agent: asl-pilot/research (kelly@bloomtech.com)
```

at 2026-05-25T01:00:00Z.

## Selected raw-video derivative policy

For each candidate the table below selects **one** derivative for download:

- **Preferred:** the IA `h.264` `.mp4` derivative (matches the existing
  FFmpeg decode chain at [`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)
  and minimizes download size while retaining the item's `licenseurl`).
- **Fallback:** when no `h.264` derivative exists, the original `MPEG4`
  upload. The IA-supplied MD5 is recorded; the local SHA-256 will be
  computed at download time and recorded by the downloader slice in
  `data/external/internet-archive-negative-challenge-videos/raw/`.
- Per-item `length` (seconds, IA-reported) is used as a sanity check
  against the `runtime` metadata field where present.

## Candidates for `hand_clap` (need +4 strong)

### 1. `henry_wallace_speech`

- **Item page:** https://archive.org/details/henry_wallace_speech
- **Title:** Henry Wallace Speech
- **Date:** 1942
- **Runtime:** 0:12:37 (757.82 s)
- **Collection:** `prelinger`
- **Creator:** William H. Pine
- **Publisher:** Pine-Thomas Productions
- **Uploader:** skipe@mindspring.com (Internet Archive contributor)
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (per IA convention, `licenseurl` is authoritative for Prelinger PD items)
- **Selected file:** `henry_wallace_speech.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/henry_wallace_speech/henry_wallace_speech.mp4
  - **Format:** `h.264`
  - **Size:** 78,829,958 bytes (~75.2 MiB)
  - **Length:** 757.87 s
  - **IA MD5:** `6e3f40a6de83e1e31e419a05f6c206ae`
  - **Original upload:** `henry_wallace_speech.mpeg` (MPEG2, 382,986,244 bytes, IA MD5 `91d18bbd234486450f2e68b7b0f9aaa1`) — not downloaded; PD scope identical.
- **Why plausible for `hand_clap`:** 1942 political speech; mid-century
  audience applause shots at start and end are conventional. Confirm
  span via visual review.
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl present; raw RGB only.

### 2. `FreedomH1956`

- **Item page:** https://archive.org/details/FreedomH1956
- **Title:** Freedom Highway (Part I)
- **Date:** 1956
- **Runtime:** 21:05 (1265.43 s)
- **Collection:** `prelinger`
- **Creator:** Fairbanks (Jerry) Productions
- **Sponsor:** Greyhound Lines, The
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (licenseurl authoritative)
- **Selected file:** `FreedomH1956.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/FreedomH1956/FreedomH1956.mp4
  - **Format:** `h.264`
  - **Size:** 131,779,839 bytes (~125.7 MiB)
  - **Length:** 1265.37 s
  - **IA MD5:** `27a8deebf36699c18b1c79138fef98a5`
  - **Original upload:** `FreedomH1956.mpeg` (MPEG2, 503,414,333 bytes, IA MD5 `6cd44c7d8e8850fe6562adfe21e1d1e4`)
- **Why plausible for `hand_clap`:** mid-century industrial / promotional
  broadcast (Greyhound-sponsored); ceremony / inauguration applause
  inserts are common in this era of Fairbanks Productions material.
  Visual review required to locate the applause sub-segment(s).
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl present.

### 3. `200768_The_Grand_Design_R2`

- **Item page:** https://archive.org/details/200768_The_Grand_Design_R2
- **Title:** The Grand Design: A Lecture on U.S. Foreign Policy (Reel 2)
- **Date:** unset
- **Runtime:** unset (file length 2197.58 s, ~36:38)
- **Collection:** `prelinger`
- **Creator:** G. Edward Griffin
- **Contributor:** Prelinger Archives
- **Uploader:** blackoystercatcher@gmail.com
- **licenseurl:** **`null`**
- **rights:** `null`
- **Selected file (if approved):** `200768_The_Grand_Design_R2_master.intros.mp4`
  - **Download URL:** https://archive.org/download/200768_The_Grand_Design_R2/200768_The_Grand_Design_R2_master.intros.mp4
  - **Format:** `h.264`
  - **Size:** 212,898,023 bytes (~203.0 MiB)
  - **Length:** 2197.58 s
  - **IA MD5:** `76eedb9ed893e921427f517b39df41af`
- **Why plausible for `hand_clap`:** lecture-format film with audience.
- **Approval status:** **defer_pending_per_item_licenseurl** — per the
  open question in
  [`internet-archive-negative-challenge-source-discovery.md`](internet-archive-negative-challenge-source-discovery.md)
  the default is to **reject items whose metadata lacks an explicit
  per-item `licenseurl`** even when the collection-level policy is
  Public Domain. This item relies on `collection:prelinger` and the
  `contributor: Prelinger Archives` line; that is collection-level
  inference, not per-item license assertion. Do not download or admit
  to the source register without an explicit per-item license signal
  (e.g., a `licenseurl` update on the IA page) or an explicit
  DECISIONS-row override.

### 4. `cnn-10-a-ballet-legend-takes-her-final-bow`

- **Item page:** https://archive.org/details/cnn-10-a-ballet-legend-takes-her-final-bow
- **Title:** A Ballet Legend Takes Her Final Bow | October 24, 2025
- **Date:** 2025-10-24
- **Runtime:** 10:00 (634.09 s)
- **Collection:** `opensource_movies`
- **Creator:** CNN 10
- **Publisher:** CNN
- **Uploader:** pretelts@yahoo.com (third-party IA uploader; not CNN)
- **licenseurl:** https://creativecommons.org/licenses/by-nd/4.0/
- **rights:** `null` (licenseurl authoritative)
- **Selected file (if approved):** `CNN10 A ballet legend takes her final bow.mp4`
  - **Download URL:** https://archive.org/download/cnn-10-a-ballet-legend-takes-her-final-bow/CNN10%20A%20ballet%20legend%20takes%20her%20final%20bow.mp4
  - **Format:** `MPEG4` (original upload; no IA h.264 derivative present)
  - **Size:** 130,111,693 bytes (~124.1 MiB)
  - **Length:** 634.09 s
  - **IA MD5:** `8963f6670662fa709c02c8b35654c642`
- **Why plausible for `hand_clap`:** modern newsroom; cleaner applause
  shots possible (legend-retirement standing ovation is the named focus).
- **Approval status:** **defer_pending_uploader_rights_review** — the
  CC BY-ND 4.0 license URL is asserted at item level, but the uploader
  is `pretelts@yahoo.com` (a third-party IA contributor) rather than
  CNN or a CNN-authorized account. Because CNN holds the underlying
  copyright on CNN 10 broadcasts, a third-party uploader's CC BY-ND
  application is not authoritative. The "ND" (No Derivatives) clause
  is, in isolation, compatible with local academic raw-RGB retention
  without redistribution (the source-discovery doc records the precedent
  for this), but the uploader-authority problem is the actual blocker
  here. Prefer Prelinger PD candidates first; revisit only if the
  `hand_clap` pool does not converge.

### 5. `hurt_20260102_202601`

- **Item page:** https://archive.org/details/hurt_20260102_202601
- **Title:** hurt
- **Date:** 2026-01-02
- **Runtime:** unset (file length 233.72 s, ~3:54)
- **Collection:** `opensource_movies`
- **Creator:** Applause
- **Uploader:** lisawiebe802@gmail.com
- **licenseurl:** https://creativecommons.org/publicdomain/mark/1.0/ (Public Domain Mark)
- **rights:** `null` (licenseurl authoritative)
- **Selected file (if approved):** `hurt.mp4`
  - **Download URL:** https://archive.org/download/hurt_20260102_202601/hurt.mp4
  - **Format:** `MPEG4` (original upload; no IA h.264 derivative present)
  - **Size:** 19,034,464 bytes (~18.2 MiB)
  - **Length:** 233.72 s
  - **IA MD5:** `30241e8756c428251ed9e5f31ab8fa97`
- **Why plausible for `hand_clap`:** the item's creator field is
  "Applause" — but that is the uploader-asserted creator string and may
  not reliably indicate applause content. Title "hurt" does not suggest
  applause content. Confirm via visual review before approving.
- **Approval status:** **defer_pending_content_match_visual_review** —
  the Public Domain Mark licenseurl is favorable, but the title and
  recent upload date with a single-word non-applause-related title
  raise content-match uncertainty. Visual review (a short 10-15 second
  sample at multiple timestamps) is required before approval.

## Candidates for `hands_cropped_out` (need +1 strong)

### 6. `DateWith1950`

- **Item page:** https://archive.org/details/DateWith1950
- **Title:** Date With Your Family, A
- **Date:** 1950
- **Runtime:** 10:00 (600.13 s)
- **Collection:** `prelinger`
- **Creator:** Simmel-Meservey
- **Sponsor:** N/A
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (licenseurl authoritative)
- **Selected file:** `DateWith1950.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/DateWith1950/DateWith1950.mp4
  - **Format:** `h.264`
  - **Size:** 62,293,446 bytes (~59.4 MiB)
  - **Length:** 600.13 s
  - **IA MD5:** `82adfaa5f503c52df31bab3b4778150e`
- **Why plausible for `hands_cropped_out`:** widely-cited Prelinger
  family-life instructional with sustained narrator-voice-over and
  head-and-shoulders staged family scenes; framing routinely crops at
  the chest or higher for multi-second spans.
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl; classic Prelinger framing pattern.

### 7. `DaysofOu1955`

- **Item page:** https://archive.org/details/DaysofOu1955
- **Title:** Days of Our Years
- **Date:** 1955
- **Runtime:** 19:33 (1202.30 s)
- **Collection:** `prelinger`
- **Creator:** Dudley Pictures Corporation
- **Sponsor:** Union Pacific Railroad
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (licenseurl authoritative)
- **Selected file:** `DaysofOu1955.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/DaysofOu1955/DaysofOu1955.mp4
  - **Format:** `h.264`
  - **Size:** 125,099,071 bytes (~119.3 MiB)
  - **Length:** 1202.30 s
  - **IA MD5:** `3053681866a18cb83a19ce9afc8a35c4`
- **Why plausible for `hands_cropped_out`:** industrial-sponsored
  educational with sustained narrator close-ups and corporate "host"
  framing. Hands-off-frame spans are typical for this run-time / sponsor
  format.
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl.

### 8. `DayCalle1955_2`

- **Item page:** https://archive.org/details/DayCalle1955_2
- **Title:** Day Called X, A (Part II)
- **Date:** ca. 1958
- **Runtime:** 15:25 (925.55 s)
- **Collection:** `prelinger`
- **Creator:** CBS Television Network
- **Sponsor:** N/A
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (licenseurl authoritative)
- **Selected file:** `DayCalle1955_2.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/DayCalle1955_2/DayCalle1955_2.mp4
  - **Format:** `h.264`
  - **Size:** 96,411,296 bytes (~91.9 MiB)
  - **Length:** 925.56 s
  - **IA MD5:** `0a6c14a591ec4a8304106449fe74010a`
- **Why plausible for `hands_cropped_out`:** mid-century CBS-produced
  Cold-War civil-defense docudrama; anchor / narrator close-ups with
  chest-up framing are routine in this format.
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl. (Note: creator field is `CBS Television Network`, but the
  item is in the Prelinger Archives PD release; the per-item licenseurl
  governs.)

### 9. `Darkness1955`

- **Item page:** https://archive.org/details/Darkness1955
- **Title:** Darkness Before the Dawn: The
- **Date:** ca. 1955
- **Runtime:** 21:14 (1274.14 s)
- **Collection:** `prelinger`
- **Creator:** Pankan (Arnold)
- **Sponsor:** Schermer (P.S.) & Co., Inc.
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (licenseurl authoritative)
- **Selected file:** `Darkness1955.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/Darkness1955/Darkness1955.mp4
  - **Format:** `h.264`
  - **Size:** 132,388,141 bytes (~126.3 MiB)
  - **Length:** 1274.14 s
  - **IA MD5:** `196886793021c23374b41700ba9bfe46`
- **Why plausible for `hands_cropped_out`:** sponsored educational with
  narrator-driven exposition; head-and-shoulders framing typical of the
  format.
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl.

### 10. `EskimosW1950`

- **Item page:** https://archive.org/details/EskimosW1950
- **Title:** Eskimos: Winter in Western Alaska
- **Date:** 1950
- **Runtime:** 8:03 (483.25 s)
- **Collection:** `prelinger`
- **Creator:** Machetanz (Frederick and Sara)
- **Sponsor:** N/A
- **licenseurl:** http://creativecommons.org/licenses/publicdomain/
- **rights:** `null` (licenseurl authoritative)
- **Selected file:** `EskimosW1950.mp4` (h.264 derivative)
  - **Download URL:** https://archive.org/download/EskimosW1950/EskimosW1950.mp4
  - **Format:** `h.264`
  - **Size:** 50,152,831 bytes (~47.8 MiB)
  - **Length:** 483.25 s
  - **IA MD5:** `ec113ca6c152a7d3588eed9cf33aef8f`
- **Why plausible for `hands_cropped_out`:** documentary narrative with
  voice-over and close-up framing of subjects in winter clothing — hands
  are commonly hidden by sleeves or off-frame for sustained spans.
- **Approval status:** **approve_pending_visual_review** — explicit PD
  licenseurl.

## Approval matrix summary

| # | Identifier | Type | Selected file | Size (MiB) | License signal | Approval status |
| - | ---------- | ---- | ------------- | ---------: | -------------- | --------------- |
| 1 | `henry_wallace_speech` | `hand_clap` | `henry_wallace_speech.mp4` (h.264) |  75.2 | Prelinger PD (licenseurl) | approve_pending_visual_review |
| 2 | `FreedomH1956` | `hand_clap` | `FreedomH1956.mp4` (h.264) | 125.7 | Prelinger PD (licenseurl) | approve_pending_visual_review |
| 3 | `200768_The_Grand_Design_R2` | `hand_clap` | `200768_The_Grand_Design_R2_master.intros.mp4` (h.264) | 203.0 | none (licenseurl `null`) | defer_pending_per_item_licenseurl |
| 4 | `cnn-10-a-ballet-legend-takes-her-final-bow` | `hand_clap` | `CNN10 A ballet legend takes her final bow.mp4` (MPEG4) | 124.1 | CC BY-ND 4.0 (uploader-asserted) | defer_pending_uploader_rights_review |
| 5 | `hurt_20260102_202601` | `hand_clap` | `hurt.mp4` (MPEG4) |  18.2 | CC PDM 1.0 | defer_pending_content_match_visual_review |
| 6 | `DateWith1950` | `hands_cropped_out` | `DateWith1950.mp4` (h.264) |  59.4 | Prelinger PD (licenseurl) | approve_pending_visual_review |
| 7 | `DaysofOu1955` | `hands_cropped_out` | `DaysofOu1955.mp4` (h.264) | 119.3 | Prelinger PD (licenseurl) | approve_pending_visual_review |
| 8 | `DayCalle1955_2` | `hands_cropped_out` | `DayCalle1955_2.mp4` (h.264) |  91.9 | Prelinger PD (licenseurl) | approve_pending_visual_review |
| 9 | `Darkness1955` | `hands_cropped_out` | `Darkness1955.mp4` (h.264) | 126.3 | Prelinger PD (licenseurl) | approve_pending_visual_review |
| 10 | `EskimosW1950` | `hands_cropped_out` | `EskimosW1950.mp4` (h.264) |  47.8 | Prelinger PD (licenseurl) | approve_pending_visual_review |

- `approve_pending_visual_review`: clear PD licenseurl; subject only to
  later visual confirmation that the selected sub-segment matches the
  challenge type.
- `defer_pending_per_item_licenseurl`: per-item licenseurl is `null`.
  Default policy is to reject collection-level-only inference; revisit
  only with an explicit DECISIONS-row override.
- `defer_pending_uploader_rights_review`: CC license is asserted at item
  level but by a third-party uploader for content whose underlying
  copyright lies with a major broadcaster. Prefer alternatives.
- `defer_pending_content_match_visual_review`: license signal is
  favorable but title/creator/date raise content-match uncertainty.

## Per-type recovery status

### `hand_clap`

- approve_pending_visual_review: 2 candidates (`henry_wallace_speech`, `FreedomH1956`).
- defer_*: 3 candidates (`200768_The_Grand_Design_R2`, `cnn-10-*`, `hurt_*`).
- Target: 4 strong; current approvable pool is **2 candidates short** of
  the target after this review. The next slice for `hand_clap` should
  expand the Prelinger `applause` probe (`probe 2` returned 64 total;
  only 25 returned on page 1) and re-run the `/metadata/<identifier>`
  enumeration on the next page of items before considering the
  deferred CC BY-ND / PD-Mark candidates.

### `hands_cropped_out`

- approve_pending_visual_review: 5 candidates (`DateWith1950`,
  `DaysofOu1955`, `DayCalle1955_2`, `Darkness1955`, `EskimosW1950`).
- defer_*: 0.
- Target: 1 strong; current approvable pool is **4 candidates over** the
  target. Visual review can prune to the strongest candidate (or admit
  more than the minimum if multiple converge cleanly under
  contact-sheet/observation review).

## License / rights notes for the planned source-register entry

If and when the next slice opens a source-register entry for
`internet-archive-negative-challenge-videos`, the entry will need to
record:

1. **Per-file license url** copied verbatim from the metadata
   (`creativecommons.org/licenses/publicdomain/`,
   `creativecommons.org/publicdomain/mark/1.0/`,
   `creativecommons.org/licenses/by-nd/4.0/`, etc.).
2. **Per-file credit** — for Prelinger items, credit "Prelinger
   Archives, Internet Archive" plus the item-level `creator`. For
   opensource_movies items, credit the item-level `creator` and
   `publisher` as they appear on the IA item page.
3. **Per-file source page URL** at `https://archive.org/details/<identifier>`.
4. **Per-file source download URL** at `https://archive.org/download/<identifier>/<file>`.
5. **Per-file IA-supplied MD5** for cross-check; the downloader slice
   will compute local SHA-256 over the downloaded raw bytes.
6. **No-derivatives note:** for the CC BY-ND 4.0 candidate (if
   ultimately approved), record "no derivatives are redistributed; raw
   bytes retained locally only for academic research evaluation."
7. **No-redistribution rule:** the source-register entry will assert
   that raw video files are NOT redistributed by this repo; only the
   provenance and validation outputs are versioned.
8. **Scope flags:** `allowed_for_model_training: false`,
   `allowed_for_validation: true`, `allowed_for_pilot_submission: true`,
   exact-file scope only, consistent with the existing
   `wikimedia-commons-negative-challenge-videos` entry.

## Next slices (out of scope for this document)

1. **Author the external rights-review receipt** at
   `docs/research/internet-archive-negative-challenge-external-rights-review-receipt.json`
   mirroring the existing
   [`wikimedia-commons-negative-challenge-external-rights-review-receipt.json`](wikimedia-commons-negative-challenge-external-rights-review-receipt.json)
   pattern (engineering source-rights and provenance review, not legal
   advice).
2. **Add a source-register entry** for
   `internet-archive-negative-challenge-videos` to
   [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json)
   with `decision_id: "approved_internet_archive_negative_challenge_exact_files_2026_05_25"`
   and the exact `approve_pending_visual_review` candidate ids.
3. **Candidate exporter** — create
   `scripts/export_internet_archive_negative_challenge_candidates.mjs`
   (sibling of the existing Wikimedia exporter) emitting the candidate
   JSON with rights metadata and the IA MD5.
4. **One-at-a-time downloader** — create
   `scripts/download_internet_archive_negative_challenge_candidates.mjs`
   in the `--delay-ms 3000 --retries 6 --one-at-a-time` style of the
   Commons recovery, writing to
   `data/external/internet-archive-negative-challenge-videos/raw/` and
   computing local SHA-256 per file.
5. **Visual review** — extend
   [`scripts/export_online_negative_challenge_contact_sheets.mjs`](../../scripts/export_online_negative_challenge_contact_sheets.mjs)
   and
   [`scripts/audit_online_negative_challenge_visual_observations.mjs`](../../scripts/audit_online_negative_challenge_visual_observations.mjs)
   to handle `internet-archive-*` candidate ids; record per-clip
   `start_time` / `end_time` for applause sub-segments where the
   candidate item is longer than ~30 seconds.
6. **Review packet + manifest export** — extend
   [`scripts/export_online_negative_challenge_review_packet.mjs`](../../scripts/export_online_negative_challenge_review_packet.mjs)
   and
   [`scripts/export_online_negative_challenge_manifest.mjs`](../../scripts/export_online_negative_challenge_manifest.mjs)
   to include `internet-archive-negative-challenge-videos` candidates.
7. **Final audit chain** — rerun:
   - `node scripts/audit_loop_premise.mjs --json`
   - `node scripts/audit_source_register.mjs`
   - `node scripts/audit_no_pretrained_deps.mjs`
   - `node scripts/audit_no_pretrained_artifact_json.mjs`
   - `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json`

If `hand_clap` does not reach 5 strong from the first IA batch + visual
review, the next slice expands probe 2 to additional pages before
considering a second source family.

## Hard limits this review respects

- No new source approval is introduced by this document; this is
  exact-file evidence only. The source register is unchanged.
- No raw videos are downloaded by this slice; no
  `data/external/internet-archive-negative-challenge-videos/raw/`
  directory is created.
- No first-party browser-collection prerequisite is implied.
- The 17-type negative-challenge gate in
  [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
  is not narrowed; the per-type minimum (5) is not lowered.
- No selected clip enters `data/manifests/negative-challenge.json`
  unless that exact `candidate_id` has
  `visual_status: "strong_visual_candidate"` in the current visual
  observations.
- No pose, landmark, embedding, detector, feature, or pretrained
  artifact is introduced; raw RGB only.
- `defer_*` candidates are explicitly excluded from any forward step
  until their respective blockers are resolved by a later observer or
  human decision.
