# CIRA Negative Challenge Source Discovery

Checked at: 2026-05-20T23:59:51Z

## Status

This is source discovery, candidate-pool, download-hash, and visual-review input
evidence only. It is not an approved dataset-source decision and does not
satisfy final negative challenge evidence.

The CIRA Satellite Library is a viable fallback candidate source for
`empty_camera`, `low_light`, and `off_center` reject-only raw-video negative challenge clips
because it hosts direct MP4 downloads for satellite imagery pages and publishes
credit guidance for NOAA/CIRA imagery. A final manifest must still use
file-level curated clips, exact downloaded hashes, decoded tensors, visual
review approval, and source-register approval for the exact files.

## Candidate Source

- Candidate source id: `cira-satellite-library-negative-challenge-videos`
- Candidate source kind: `public_reference_dataset`
- Candidate allowed scope if approved later: raw-video validation evidence for
  reject-only `empty_camera`, `low_light`, and `off_center` challenge clips.
- Not approved for final use yet: the current source register does not contain
  an approved CIRA source decision.

## Discovery Method

The source discovery used CIRA Satellite Library pages and their direct MP4
download links:

- `https://satlib.cira.colostate.edu/weather_media/ground-snow-and-lake-effect-snow-at-night/`
- `https://satlib.cira.colostate.edu/weather_media/fog-spreads-through-californias-central-valley-at-night/`
- `https://satlib.cira.colostate.edu/weather_media/tropical-cyclone-narelle-seen-intensifying-at-night/`
- `https://satlib.cira.colostate.edu/weather_media/lightning-flashes-from-line-of-thunderstorms-at-night/`
- `https://satlib.cira.colostate.edu/weather_media/brush-fire-at-night-in-south-florida/`
- `https://satlib.cira.colostate.edu/weather_media/snow-and-lake-ice-at-night-in-the-upper-midwest/`
- `https://satlib.cira.colostate.edu/weather_media/trail-of-snow-streaks-across-the-central-us/`
- `https://satlib.cira.colostate.edu/weather_media/changes-in-the-permian-basin-oil-field-over-the-years/`
- `https://satlib.cira.colostate.edu/weather_media/mount-erebus-hotspot-seen-from-polar-orbiting-satellites/`
- `https://satlib.cira.colostate.edu/weather_media/abundant-lightning-strikes-across-the-plains/`

CIRA credit guidance is retained as the upstream source reference:

- `https://satlib.cira.colostate.edu/credit-media/`

## File-Level Candidate Pool

A first CIRA file-level candidate pool now lives at:

- `docs/research/cira-negative-challenge-candidates.json`

It was generated with:

```sh
node scripts/export_cira_negative_challenge_candidates.mjs --write
```

The candidate export currently has 15 total candidates:

| Challenge type | Candidate count |
| --- | ---: |
| `empty_camera` | 5 |
| `low_light` | 5 |
| `off_center` | 5 |

The candidate JSON is intentionally marked
`finality: "not_final_model_evidence"` and every candidate has
`review_status: "needs_visual_review"` plus
`final_manifest_eligible: false`. It is suitable as input to visual review,
exact-file source approval, and possible negative-challenge import; it is not
sufficient for final evaluation by itself.

## Download Evidence

Download evidence for the current CIRA candidate pool now lives at:

- `docs/research/cira-negative-challenge-downloads.json`

It was generated with:

```sh
node scripts/export_cira_negative_challenge_candidates.mjs --write --download --delay-ms 500
```

Current status is `downloaded`, not final. Fifteen CIRA candidate MP4 files are
downloaded and hash-pinned locally: all five `empty_camera`, all five
`low_light`, and all five `off_center` candidates.

Review inputs for the CIRA candidates now live at:

- `docs/review/cira-negative-challenge-review-packet.json`
- `docs/review/cira-negative-challenge-review.html`

They were generated with:

```sh
node scripts/export_cira_negative_challenge_review_packet.mjs
node scripts/export_wikimedia_commons_negative_challenge_review_html.mjs \
  --packet docs/review/cira-negative-challenge-review-packet.json \
  --output docs/review/cira-negative-challenge-review.html
```

These files are review input only. They are not source-register approval, not a
final manifest, and not model evidence.

## Mixed Online Review Packet

The downloaded CIRA files now also participate in a mixed-source online review
packet with downloaded Wikimedia Commons files:

- `docs/review/online-negative-challenge-review-packet.json`
- `docs/review/online-negative-challenge-review.html`

It was generated and audited with:

```sh
node scripts/export_online_negative_challenge_review_packet.mjs
node scripts/audit_online_negative_challenge_review_packet.mjs
node scripts/export_wikimedia_commons_negative_challenge_review_html.mjs \
  --packet docs/review/online-negative-challenge-review-packet.json \
  --output docs/review/online-negative-challenge-review.html
```

The mixed packet currently has 20 downloaded and hash-verified clips: three
`empty_camera` from Wikimedia Commons, two `empty_camera` from CIRA, five
`no_hands_visible` from Wikimedia Commons, four `low_light` from Wikimedia
Commons, one `low_light` from CIRA, and five `off_center` from CIRA. The mixed
packet selection excludes two previously weak Wikimedia `empty_camera`
candidates based on non-final contact-sheet observations. It is still only
review input. If this mixed-source route is used, both source IDs need
exact-file source-register approval before manifest generation.

## Required Follow-Up

1. Visually review every CIRA candidate and reject any file that does not match
   the assigned challenge type.
2. Add source-register approval only after exact-file rights review approves
   the retained candidate list and required credit/provenance obligations.
3. Combine approved CIRA files with approved files for the remaining
   `empty_camera` and `no_hands_visible` negative challenge types.
4. Import the approved files into the final negative challenge manifest path,
   decode raw RGB frame tensors, and generate
   `data/manifests/negative-challenge.json`.
5. Run final evaluation without `--allow-smoke-eval`; do not promote any
   candidate as final until the manifest and model metrics pass.
