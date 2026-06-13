# Internet Archive Negative Challenge Probe Results

Checked at: 2026-05-25T00:55:00Z

## Status

This is API-probe evidence only. It is **not** an approved dataset-source
decision, does not add any exact-file approval to
[`docs/model/dataset-source-register.json`](../model/dataset-source-register.json),
and does not commit any clip to
[`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json).
It exists to prove the planned Internet Archive API path from
[`internet-archive-negative-challenge-source-discovery.md`](internet-archive-negative-challenge-source-discovery.md)
returns concrete, rights-tagged candidate items for `hand_clap` and
`hands_cropped_out` before the next slice authors an exact-file source review.

All raw probe responses are pinned at
[`artifacts/research/internet-archive-negative-challenge-probes/`](../../artifacts/research/internet-archive-negative-challenge-probes/).

## Probes executed

| # | Query                                                                                                  | Endpoint                                                                                   | `numFound` | Saved file                                                                                                                                                                                  |
| - | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `mediatype:movies AND collection:prelinger AND (applause OR clapping) AND rights:publicdomain`         | `/advancedsearch.php`                                                                      |          0 | [`prelinger-applause-rights-publicdomain.json`](../../artifacts/research/internet-archive-negative-challenge-probes/prelinger-applause-rights-publicdomain.json)                              |
| 2 | `mediatype:movies AND collection:prelinger AND (applause OR clapping)` (no rights filter)               | `/advancedsearch.php`                                                                      |         64 | [`prelinger-applause-no-rights-filter.json`](../../artifacts/research/internet-archive-negative-challenge-probes/prelinger-applause-no-rights-filter.json)                                    |
| 3 | `mediatype:movies AND collection:prelinger AND (narrator OR "talking head" OR instructional)`           | `/advancedsearch.php`                                                                      |       1170 | [`prelinger-narrator-instructional.json`](../../artifacts/research/internet-archive-negative-challenge-probes/prelinger-narrator-instructional.json)                                          |
| 4 | `mediatype:movies AND collection:opensource_movies AND (applause OR clapping) AND licenseurl:*creativecommons*` | `/advancedsearch.php`                                                                      |        107 | [`opensource-applause-cc.json`](../../artifacts/research/internet-archive-negative-challenge-probes/opensource-applause-cc.json)                                                              |
| 5 | per-item metadata for `henry_wallace_speech` (probe-2 result)                                           | `/metadata/<identifier>`                                                                   |     n/a    | [`metadata-henry_wallace_speech.json`](../../artifacts/research/internet-archive-negative-challenge-probes/metadata-henry_wallace_speech.json)                                                |

## Key findings

### 1. The `/advancedsearch.php` response does NOT return `rights` for Prelinger items

Probes 1 and 2 are the same query except for the `rights:publicdomain`
clause. Probe 1 returned 0 hits and probe 2 returned 64. In probe 2 every
returned `docs[i].rights` value is `null`, even for items whose
collection-level policy is well-known to be Public Domain.

This means **the `/metadata/<identifier>` endpoint is the source of truth
for per-item rights**, not the `rights` filter on `/advancedsearch.php`.

Probe 5 confirms this: the metadata blob for `henry_wallace_speech` is
`{"licenseurl": "http://creativecommons.org/licenses/publicdomain/",
"rights": null, "collection": "prelinger"}`. The `licenseurl` field carries
the rights signal, not the `rights` field.

**Implication for the follow-up source-review slice:** every candidate
must be re-fetched via `/metadata/<identifier>` to capture the authoritative
`licenseurl` and the actual file list. Discovery-time queries should NOT
include `rights:publicdomain` because it filters out most Prelinger items.

### 2. Per-item metadata returns multiple raw video derivatives per item

The `henry_wallace_speech` metadata returned three raw-video files for the
same item:

| `format`       | `name`                          |   `size` |
| -------------- | -------------------------------- | -------: |
| `h.264`        | `henry_wallace_speech.mp4`       |    79 MB |
| `MPEG2`        | `henry_wallace_speech.mpeg`      |   383 MB |
| `Ogg Video`    | `henry_wallace_speech.ogv`       |    58 MB |

The source-review slice should select **one** derivative per item (the
preferred default is `h.264` `.mp4` for size+codec compatibility with the
existing FFmpeg decode chain at
[`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)). The
MPEG2 `.mpeg` is the original upload; the `.mp4` is an IA derivative. Both
are raw video; the smaller derivative is preferred for download cost while
keeping rights identical (the IA derivative carries the item's `licenseurl`).

### 3. Prelinger `applause` probe (#2) hit candidates

The 64-hit set is dominated by mid-century ephemeral films. Notable
candidates where applause is plausibly present as a sub-segment (most
items will need start/end timestamps from visual review):

| `identifier`                                                       | Title (truncated)                                          | Year | Why plausible                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------- | ---: | --------------------------------------------------------------- |
| `henry_wallace_speech`                                              | Henry Wallace Speech                                        | 1942 | political speech with audience applause (PD via licenseurl)     |
| `0381_Placerville_California_El_Dorado_County_Fair_and_John_M_Studeba_12_40_47_20` | Placerville, California: El Dorado County Fair  | n/a  | county fair event with ceremony applause                         |
| `204869_On_the_River_Front_of_New_Orleans`                          | On the River Front of New Orleans                           | n/a  | early city film with crowd shots                                |
| `0549_Kentucky_Pioneers_15_01_15_11`                                | Kentucky Pioneers                                           | 1941 | ceremony/heritage film                                          |
| `0565_Vista_Stock_Shots_Entertainment`                              | Vista Stock Shots: Entertainment                            | 1962 | stock-footage compilation, likely contains applause inserts     |
| `0512_That_Junior_Miss_Spirit_03_01_00_05`                           | That Junior Miss Spirit                                     | 1970 | school spirit film, applause plausible                          |
| `200768_The_Grand_Design_R2`                                        | The Grand Design: A Lecture on U.S. Foreign Policy (Reel 2) | n/a  | lecture, audience applause plausible                            |
| `0580_We_The_People_Willkie_McNary_Know_Their_Farming_09_39_21_00`   | We, The People (Willkie & McNary Know Their Farming)        | 1940 | political broadcast                                             |
| `FreedomH1956`                                                      | Freedom Highway (Part I)                                    | 1956 | mid-century broadcast (21:05 runtime)                           |

The follow-up slice needs to confirm rights per-item via `/metadata` and
visually confirm the applause segment. Plan to fetch metadata for the top
8-10 items in parallel and visually review the short ones first.

### 4. Prelinger `narrator/instructional` probe (#3) hit candidates

1170 hits, all from collection `prelinger`. Top items returned
`licenseurl: http://creativecommons.org/licenses/publicdomain/`:

| `identifier`     | Title                                       |
| ----------------- | ------------------------------------------- |
| `DayCalle1955_2`  | A Day Called X (Part II)                    |
| `DaysofOu1955`    | Days of Our Years                           |
| `Darkness1955`    | Darkness Before the Dawn: The               |
| `DateWith1950`    | A Date With Your Family                     |
| `EskimosW1950`    | Eskimos: Winter in Western Alaska           |

These are classic narrator-driven 1950s educational films. `A Date With
Your Family` and `Darkness Before the Dawn` in particular are well-known
PD instructional films that feature sustained narrator-and-actor close-up
shots where the speakers' hands are off-camera or below the bottom of the
frame for multi-second spans. This is exactly the framing pattern that
matches `hands_cropped_out`.

### 5. Opensource_movies CC applause probe (#4) hit candidates

107 hits with a mix of license URLs. The license distribution skews toward
`CC BY-NC-ND` and `CC BY-NC-SA`, which is a flag for source-review:

| `identifier`                                          | License                                                          | Why interesting                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `cnn-10-a-ballet-legend-takes-her-final-bow`           | `https://creativecommons.org/licenses/by-nd/4.0/`                | modern CNN-10 newsroom intros/outros include cleaner applause shots; ND flag    |
| `JohnKerryFourSeasons4802`                             | `http://creativecommons.org/licenses/by-nc-nd/3.0/`              | Secretary-of-State remarks, audience applause guaranteed; NC + ND flag          |
| `hurt_20260102_202601`                                | `https://creativecommons.org/publicdomain/mark/1.0/`             | Public Domain Mark (cleaner than CC BY-NC-*)                                    |
| `Guterman_Video4`                                     | `http://creativecommons.org/licenses/by-nc-nd/3.0/`              | Counseling Association event, applause likely; NC + ND flag                     |

**ND-clause flag:** "No Derivatives" restricts redistribution of
derivative works. Local sub-clip selection for academic research evaluation
is generally consistent with ND because we are not redistributing modified
copies — we keep raw RGB locally. The source-review slice must record
"no derivatives are redistributed" and prefer Public-Domain-Mark and CC BY
items (no ND/NC) where the candidate pool allows.

## Recommended starting batch for the follow-up source-review slice

The next slice should fetch `/metadata/<identifier>` for these 10 items
and visually review the short ones first:

For `hand_clap` (gap 4 strong):

1. `henry_wallace_speech` (Prelinger PD; 12:37 runtime; audience applause expected)
2. `FreedomH1956` (Prelinger; 21:05 runtime; mid-century broadcast)
3. `200768_The_Grand_Design_R2` (Prelinger; lecture with audience)
4. `cnn-10-a-ballet-legend-takes-her-final-bow` (CC BY-ND 4.0; 10:00 runtime; modern newsroom)
5. `hurt_20260102_202601` (CC0 Public Domain Mark)

For `hands_cropped_out` (gap 1 strong):

6. `DateWith1950` (Prelinger PD; classic narrator instructional)
7. `DaysofOu1955` (Prelinger PD; narrator instructional)
8. `DayCalle1955_2` (Prelinger PD; instructional)
9. `Darkness1955` (Prelinger PD; instructional)
10. `EskimosW1950` (Prelinger PD; narrator documentary)

If after metadata fetch + visual review fewer than 4 strong `hand_clap`
candidates emerge, the slice expands to additional Prelinger pages
(probe 2 returned 64 total; only 25 returned in the first page) and/or
additional opensource_movies pages (probe 4 returned 107 total). If
fewer than 1 strong `hands_cropped_out` candidate emerges, the slice
expands probe 3 (1170 total available) before trying a second source
family.

## Hard limits this probe respects

- No new source approval is introduced; the source register is unchanged.
- No raw videos are downloaded; only JSON probe responses are saved under
  `artifacts/research/internet-archive-negative-challenge-probes/`.
- No first-party browser-collection prerequisite is implied.
- The 17-type negative-challenge gate is not narrowed; the 5-per-type
  minimum is not lowered.
- No pose, landmark, embedding, detector, feature, or pretrained artifact
  is introduced.
- The `rights:publicdomain` filter discovery (probe 1 vs probe 2) is
  recorded as a known IA API quirk; do not rely on the
  `/advancedsearch.php` `rights` filter going forward, use
  `/metadata/<identifier>` instead.
