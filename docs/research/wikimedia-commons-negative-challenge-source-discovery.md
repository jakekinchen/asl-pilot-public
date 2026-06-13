# Wikimedia Commons Negative Challenge Source Discovery

Checked at: 2026-05-20T22:47:24Z

## Status

This is source discovery and candidate-pool evidence only. It is not an
approved dataset-source decision and does not satisfy final negative challenge
evidence.

Wikimedia Commons appears viable as a candidate source for reject-only raw-video
negative challenge clips because Commons hosts freely licensed WebM/Ogg video
files with per-file license metadata and direct original-file URLs. A final
manifest must still use a file-level curated candidate list, hash-pin every
downloaded video, decode tensors, and retain operator review for the exact
challenge type assigned to each clip.

## Candidate Source

- Candidate source id: `wikimedia-commons-negative-challenge-videos`
- Candidate source kind: `public_reference_dataset`
- Candidate allowed scope if approved later: raw-video validation and pilot
  submission evidence for reject-only negative challenge clips.
- Not approved for final use yet: the current source register does not contain
  an approved Wikimedia Commons source decision.

## Discovery Method

The current source discovery used the Wikimedia Commons MediaWiki API:

```sh
curl -s 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:video%20empty%20room&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json'
curl -s 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:video%20dark%20room&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json'
curl -s 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:video%20no%20hands&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json'
```

Wikimedia Commons API and video-format docs are retained as the upstream source
references for the discovery method:

- `https://commons.wikimedia.org/wiki/Commons:API`
- `https://commons.wikimedia.org/wiki/Commons:Video?uselang=en-gb`

## Candidate Files Found During Discovery

These examples are not reviewed final clips. They are only a candidate pool for
manual pruning and source-rights review.

| Query intent | Commons file | MIME | License short name | Original URL |
| --- | --- | --- | --- | --- |
| empty room | `File:The Backrooms (Found Footage) - Level 5 Security Cameras Recordings.webm` | `video/webm` | `CC BY 3.0` | `https://upload.wikimedia.org/wikipedia/commons/5/5b/The_Backrooms_%28Found_Footage%29_-_Level_5_Security_Cameras_Recordings.webm` |
| empty/dark room | `File:USVI MVI 5231 - Dark blue sofas with white pillows face a wooden bookshelf filled with shells and sculptures in a cozy living room.webm` | `video/webm` | `Public domain` | `https://upload.wikimedia.org/wikipedia/commons/0/03/USVI_MVI_5231_-_Dark_blue_sofas_with_white_pillows_face_a_wooden_bookshelf_filled_with_shells_and_sculptures_in_a_cozy_living_room.webm` |
| dark room | `File:Veo-3 animation example - Chernobyl decaying room.webm` | `video/webm` | `Public domain` | `https://upload.wikimedia.org/wikipedia/commons/f/ff/Veo-3_animation_example_-_Chernobyl_decaying_room.webm` |
| no-hands/non-ASL | `File:Clean hands short.webm` | `video/webm` | `Public domain` | `https://upload.wikimedia.org/wikipedia/commons/8/89/Clean_hands_short.webm` |
| no-hands/non-ASL | `File:Hand Hygiene Saves Lives.webm` | `video/webm` | `Public domain` | `https://upload.wikimedia.org/wikipedia/commons/a/aa/Hand_Hygiene_Saves_Lives.webm` |

## File-Level Candidate Pool

A first file-level candidate pool now lives at:

- `docs/research/wikimedia-commons-negative-challenge-candidates.json`

It was generated with:

```sh
node scripts/export_wikimedia_commons_negative_challenge_candidates.mjs --write
node scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs
```

The candidate audit currently passes with 20 total candidates:

| Challenge type | Candidate count |
| --- | ---: |
| `empty_camera` | 5 |
| `no_hands_visible` | 5 |
| `low_light` | 5 |
| `off_center` | 5 |

The candidate JSON is intentionally marked
`finality: "not_final_model_evidence"` and every candidate has
`review_status: "needs_visual_review"` plus
`final_manifest_eligible: false`. It is suitable as input to visual review,
download, exact-file source approval, and manifest generation; it is not
sufficient for final evaluation by itself.

## Partial Download Evidence

Download evidence for the current candidate pool now lives at:

- `docs/research/wikimedia-commons-negative-challenge-downloads.json`

It was generated with:

```sh
node scripts/download_wikimedia_commons_negative_challenge_candidates.mjs --write --dry-run
```

The downloader can resume actual downloads with:

```sh
node scripts/download_wikimedia_commons_negative_challenge_candidates.mjs --write --delay-ms 3000 --retries 6
```

Current status is `blocked`, not final. Fourteen candidate videos are
downloaded and hash-pinned locally: all five `empty_camera` candidates, all
five `no_hands_visible` candidates, and four `low_light` candidates. The
remaining files were not downloaded after the Commons upload host returned HTTP
429 during the interactive download attempts.

Validate current download evidence with:

```sh
node scripts/audit_wikimedia_commons_negative_challenge_downloads.mjs
```

The audit currently fails as expected because the download set is incomplete:
`empty_camera` has five downloaded files, `no_hands_visible` has five,
`low_light` has four, and `off_center` has zero.

A visual-review packet for candidates and downloaded files now lives at:

- `docs/review/wikimedia-commons-negative-challenge-review-packet.json`

It was generated with:

```sh
node scripts/export_wikimedia_commons_negative_challenge_review_packet.mjs
```

The packet is review input only. It is not source-register approval, not a final
manifest, and not model evidence.

A static local review page for the same packet now lives at:

- `docs/review/wikimedia-commons-negative-challenge-review.html`

It was generated with:

```sh
node scripts/export_wikimedia_commons_negative_challenge_review_html.mjs
```

The page embeds downloaded local video files where present and marks missing
downloads explicitly. It is only a convenience view for human pruning and does
not approve any clip for the source register or final manifest.

## Required Follow-Up

1. Visually review every candidate and prune/replace files that do not match
   the assigned challenge type.
2. Download only approved files, retain downloaded video SHA-256 hashes, and
   verify that the downloaded hash matches each future manifest clip. Resume
   cautiously because the Commons upload host may rate-limit direct downloads.
3. Add a source-register entry only after file-level rights review approves the
   exact candidate list.
4. Import the approved files into `data/external/` or `data/clips/`, decode raw
   RGB frame tensors, and generate `data/manifests/negative-challenge.json`.
5. Run final evaluation without `--allow-smoke-eval`; do not promote any
   candidate as final until the manifest and model metrics pass.
