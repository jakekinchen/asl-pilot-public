# Internet Archive Negative Challenge Source Discovery

Checked at: 2026-05-25T00:45:00Z

## Status

This is source discovery and candidate-strategy evidence only. It is **not** an
approved dataset-source decision, does not add any new exact-file approval to
[`docs/model/dataset-source-register.json`](../model/dataset-source-register.json),
and does not satisfy final negative-challenge evidence.

It exists because the Wikimedia Commons spare pools for `hands_cropped_out`
and `hand_clap` have been exhausted under denser sampling
([`docs/session-logs/099-commons-hands-cropped-out-spare-exhausted.md`](../session-logs/099-commons-hands-cropped-out-spare-exhausted.md))
and [`DECISIONS.md`](../../DECISIONS.md) row #6 option `(a-2)` authorizes
"supplement Commons with broader non-Commons CC sources (Internet Archive,
etc.) under new source-register approval." Per the active per-milestone prompt
[`docs/model/online-negative-challenge-source-unblock-goal-loop-prompt.md`](../model/online-negative-challenge-source-unblock-goal-loop-prompt.md)
and the observer redirect at
[`docs/session-logs/100-observer-redirect-broader-source-discovery.md`](../session-logs/100-observer-redirect-broader-source-discovery.md),
this work uses online raw-video sources only.

## Scope

Two underfilled negative-challenge types currently block
`audit_final_manifests.py` after the Commons spare exhaustion:

| Type              | Strong | NHR | Replace | Gap (need 5 strong) |
| ----------------- | -----: | --: | ------: | -------------------- |
| `hand_clap`        |      1 |   4 |       0 | 4 strong needed      |
| `hands_cropped_out`|      4 |   1 |       0 | 1 strong needed      |

The negative-challenge intent for each type, from
[`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
L70-L88 and prior Commons review:

- `hand_clap` — applause / clapping (raw two-handed clap motion).
- `hands_cropped_out` — person visible on camera but their hands are NOT in
  frame at all (chest-up, head-and-shoulders, or talking-head framing with
  hands consistently out of frame across the sampled timestamps).

This discovery slice covers only these two types. The remaining four
Commons-constrained types (`casual_non_asl_gesture`, `counting`,
`fingerspelling_like_motion`, `idle_hands`, `mouth_touch`, `thumbs_up`) and
the three hard ASL-domain types (`partial_sign`, `wrong_location`,
`wrong_palm_orientation`) are out of scope for this document.

## Source family triage

[`artifacts/research/observer-067-source-discovery/source-discovery-memo.md`](../../artifacts/research/observer-067-source-discovery/source-discovery-memo.md)
(family F) identifies the Internet Archive Moving Image and Prelinger
Archives as a Public-Domain / CC-rich source family for backfilling
`idle_hands`, `mouth_touch`, `casual_non_asl_gesture`, and similar
human-centric framing/gesture types via direct raw MP4 / MPEG downloads.

The Internet Archive is the preferred next source family for this slice
because:

1. Most Prelinger Archive and Moving Image Archive items are released as
   Public Domain (`publicdomain` rights string in IA metadata) or CC0 / CC
   BY, which is the simplest license profile to retain and credit.
2. IA exposes a stable `/advancedsearch.php` JSON endpoint and a
   per-item `/metadata/<identifier>` JSON endpoint that names every file in
   the item with its size, format, and (when present) per-file rights
   field. This matches the existing exact-file provenance pattern used by
   `online-negative-challenge-mixed-source-audit.json`.
3. Direct raw MP4 / MPEG-2 / WebM / Ogg downloads are available via
   `https://archive.org/download/<identifier>/<file>` with no signed
   agreement, no Captcha, and a forgiving rate limit suitable for the
   one-at-a-time cooldown style used during the Commons recovery.
4. Prelinger educational / family-life / industrial / television films often
   contain explicit applause sequences (graduations, ceremonies, classroom
   demonstrations, lecture intros/outros) and explicit
   chest-up / head-and-shoulders interview framing (newsreel-style narrators,
   instructional voice-overs, mid-century corporate "host" framing) — both
   directly matching `hand_clap` and `hands_cropped_out` negative-challenge
   intent.
5. No pretrained CV artifact, no landmark, no pose, no embedding, no detector,
   and no feature is required by IA retrieval. The pipeline remains
   raw-RGB only.

A note on what this document does NOT do:

- It does not approve a new source-register decision id for the Internet
  Archive. That requires per-clip provenance evidence
  (`identifier`, file name, source page URL, original file URL, rights
  field, local SHA-256, license/credit metadata) and a follow-up
  `internet-archive-negative-challenge-source-review.md` plus a
  `docs/research/internet-archive-negative-challenge-external-rights-review-receipt.json`
  receipt, mirroring the existing
  `wikimedia-commons-negative-challenge-external-rights-review-receipt.json`
  pattern.
- It does not download any media. The
  `data/external/internet-archive-negative-challenge-videos/raw/` directory
  is not created by this slice.
- It does not extend
  [`scripts/export_online_negative_challenge_review_packet.mjs`](../../scripts/export_online_negative_challenge_review_packet.mjs)
  or
  [`scripts/export_online_negative_challenge_manifest.mjs`](../../scripts/export_online_negative_challenge_manifest.mjs)
  to include `internet-archive-*` candidate ids.

## Candidate IA collections (planning, not selection)

The following IA collections are the planned starting point for the
follow-up exact-source-review slice. Each is a *plausible* match; every
candidate clip still requires per-item rights confirmation and visual review
before any exact-file approval.

| Type                | IA collection                                  | Plausible items                                                                                              | Why                                                                                                                                                                                                                                              |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hand_clap`         | `collection:prelinger`                          | educational / industrial films with classroom or auditorium applause sequences (e.g. graduation ceremonies, school assemblies, mid-century corporate award presentations) | Prelinger explicitly contains a large body of ephemeral US educational/industrial films with crowd-applause scenes; rights string is overwhelmingly `publicdomain`.                                                                                |
| `hand_clap`         | `collection:moviesandfilms`                     | newsreel applause inserts (Universal Newsreels, House of David, mid-century broadcast inserts)               | Newsreel cutaways frequently include 1-3 second close-up applause shots. Many entries are `publicdomain` (US Government / Universal Newsreel public-domain releases).                                                                              |
| `hand_clap`         | `collection:opensource_movies` (CC-filtered)    | CC BY / CC0 conference recordings, lecture series, free-culture film festivals with applause                 | Open-source movies includes CC-licensed lectures and conference recordings where applause segments at start/end are common. Filter on `licenseurl:*creativecommons*` or `rights:cc0`.                                                            |
| `hands_cropped_out` | `collection:prelinger`                          | mid-century instructional films, classroom-narrator close-ups, television-style host introductions          | Prelinger industrial/educational films frequently use head-and-shoulders narrator framing where hands stay off-camera for sustained 5-20 second spans.                                                                                            |
| `hands_cropped_out` | `collection:moviesandfilms`                     | newsreel anchors, mid-century broadcast announcers, public-domain news intros                                | Public-domain newsreels (Universal Newsreel etc.) have prolonged anchor / narrator close-up shots without hand visibility.                                                                                                                        |
| `hands_cropped_out` | `collection:opensource_movies` (CC-filtered)    | CC-licensed talking-head / vlog / lecture intros where camera framing crops at the chest or higher           | Many CC-licensed creator videos use chest-up framing or floating head-and-shoulders crop in vlog-style intros and outros.                                                                                                                         |

The deliberate omission of `collection:youtube_archive` and
`collection:tv` items is intentional — those collections frequently carry
broadcaster copyright (despite being on IA) or rebroadcast-only rights,
and the existing source-register policy treats YouTube-derived media
as needing explicit reviewer scope per the active prompt's Hard Limits.

## Planned API probes (not yet executed in this slice)

The follow-up slice will execute these probes using IA's public
`/advancedsearch.php` endpoint, the same JSON-response pattern used by
the existing Commons exporter:

```text
GET https://archive.org/advancedsearch.php
    ?q=mediatype:movies+AND+collection:prelinger+AND+(applause+OR+clapping)
    +AND+rights:publicdomain
    &fl[]=identifier&fl[]=title&fl[]=mediatype&fl[]=collection
    &fl[]=licenseurl&fl[]=rights&fl[]=year&fl[]=runtime
    &rows=25&page=1&output=json

GET https://archive.org/advancedsearch.php
    ?q=mediatype:movies+AND+collection:prelinger+AND+(narrator+OR+"talking head"+OR+instructional)
    +AND+rights:publicdomain
    &fl[]=identifier&fl[]=title&fl[]=mediatype&fl[]=collection
    &fl[]=licenseurl&fl[]=rights&fl[]=year&fl[]=runtime
    &rows=25&page=1&output=json
```

For each promising identifier the follow-up slice will then call:

```text
GET https://archive.org/metadata/<identifier>
```

to enumerate per-file MP4 / MPEG / WebM derivatives, capture file-level
size, original file path, derived file path, and per-file `rights` string
where present. The returned per-file SHA-1 (IA's default checksum) is
captured for provenance and a local SHA-256 is computed at download time.

Each candidate clip eventually needs at least 5-15 seconds of clearly
matching content for the type (sustained applause for `hand_clap`,
sustained hands-out-of-frame narrator close-up for `hands_cropped_out`)
so the follow-up slice's exact-source review must cite per-clip start/end
timestamps when the matching span is a sub-segment of a longer item.

## License / rights notes

The Internet Archive does not assert per-item rights — rights belong to the
contributor / depositor. For each candidate item the follow-up review must
record:

1. The IA per-item `rights` field (commonly `publicdomain`,
   `creativecommons.org/licenses/by/4.0/`, `creativecommons.org/publicdomain/zero/1.0/`, etc.).
2. The IA collection (e.g. `prelinger`) and its high-level rights guidance.
3. The contributor name and any attribution / credit text required by the
   chosen license.
4. The exact source page URL `https://archive.org/details/<identifier>`.
5. The exact source file URL `https://archive.org/download/<identifier>/<file>`.
6. The local download path under
   `data/external/internet-archive-negative-challenge-videos/raw/`.
7. The local SHA-256 of the downloaded file (raw bytes, not transcoded).
8. The original IA-reported file format (mp4 / mpeg2 / webm / ogv) and a
   note when the candidate uses an IA-derived format rather than the
   original upload.

The follow-up source review will reject any item whose `rights` field is
absent or whose contributor / item page disclaims redistribution. Per the
active prompt Hard Limits, "noncommercial, research-only, public-domain, CC,
or stock-license terms" are not blockers for this school research project;
the bar is the existence of clear per-item license terms and that those
terms do not plainly conflict with local academic research use or raw-video
retention.

## Planned follow-up sequence

These are the next slices, not part of this discovery slice:

1. **Exact-file source review** — author
   `docs/research/internet-archive-negative-challenge-source-review.md`
   listing the exact candidate IA identifiers + file paths + local SHA-256
   + license/credit metadata for the smallest useful batch (`hand_clap`
   first, target +4 strong; then `hands_cropped_out`, target +1 strong).
2. **External rights-review receipt** — author
   `docs/research/internet-archive-negative-challenge-external-rights-review-receipt.json`
   mirroring the existing
   `wikimedia-commons-negative-challenge-external-rights-review-receipt.json`
   pattern (engineering source-rights and provenance review; not legal
   advice).
3. **Source-register entry** — add an
   `internet-archive-negative-challenge-videos` entry to
   `docs/model/dataset-source-register.json` with
   `decision_id: "approved_internet_archive_negative_challenge_exact_files_<date>"`,
   `allowed_for_model_training: false`,
   `allowed_for_validation: true`,
   `allowed_for_pilot_submission: true`, exact-file scope only.
4. **Candidate exporter** — extend or add
   `scripts/export_internet_archive_negative_challenge_candidates.mjs`
   (sibling of the existing
   `scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`)
   to emit the candidate list with rights metadata.
5. **One-at-a-time download** — extend or add
   `scripts/download_internet_archive_negative_challenge_candidates.mjs`
   with the same `--delay-ms 3000 --retries 6` cooldown style and a
   `--one-at-a-time` mode honoring the Commons-recovery convention.
6. **Visual review + contact sheets** — extend
   `scripts/export_online_negative_challenge_contact_sheets.mjs` and
   `scripts/audit_online_negative_challenge_visual_observations.mjs`
   to handle `internet-archive-*` candidate ids and source-id, plus
   record per-clip start/end span when a sub-segment is used.
7. **Review packet + manifest export** — extend
   `scripts/export_online_negative_challenge_review_packet.mjs` and
   `scripts/export_online_negative_challenge_manifest.mjs` to include
   `internet-archive-negative-challenge-videos` candidates so they can
   enter `data/manifests/negative-challenge.json` once their selected
   packet has >=5 strong visual candidates per type.
8. **Final audit chain** — rerun:
   - `node scripts/audit_loop_premise.mjs --json`
   - `node scripts/audit_source_register.mjs`
   - `node scripts/audit_no_pretrained_deps.mjs`
   - `node scripts/audit_no_pretrained_artifact_json.mjs`
   - `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json`

If `hand_clap` does not reach 5 strong from a single small IA batch, the
follow-up slice repeats with a narrowed query before considering a second
source family.

## Hard limits this discovery respects

- No new source approval is introduced in this document; this is research
  evidence only.
- No raw videos are downloaded by this slice; no
  `data/external/internet-archive-negative-challenge-videos/raw/` directory
  is created.
- No first-party browser-collection prerequisite is implied.
- The 17-type negative-challenge gate in `scripts/evaluate_rawframe_model.py`
  is not narrowed; the per-type minimum (5) is not lowered.
- No selected clip enters `data/manifests/negative-challenge.json` unless
  that exact `candidate_id` has `visual_status: "strong_visual_candidate"`
  in the current visual observations.
- No pose, landmark, embedding, detector, feature, or pretrained artifact
  is introduced.

## Open questions

- For Prelinger items released without an explicit per-item `rights` field
  but inside a collection whose collection-level policy is "Public Domain,"
  is the collection-level policy sufficient for source-register approval?
  Default: require an explicit per-item `rights` string of
  `publicdomain` or a clear CC URL, and reject items relying only on
  collection-level inference. Surface in
  [`DECISIONS.md`](../../DECISIONS.md) row #6 if the per-item-only rule
  causes the candidate pool to under-shoot the 5-per-type minimum.

- For `hand_clap`, applause shots are frequently 2-5 seconds inside a
  longer film. Does the existing exporter / visual-review chain support a
  per-clip `start_time` / `end_time` field in the candidate JSON, or does
  the follow-up slice need to first add that field to the candidate
  schema? Default: confirm the schema in the follow-up slice; add the
  field if absent (it is also needed for the planned How2Sign / PHOENIX
  transform path).

- Some IA newsreel items appear to be released as public domain but bear
  a credit line that requires attribution to "Universal Newsreel" or
  similar. Is the existing source-rights review able to encode an
  attribution-required public-domain item? Default: yes — the existing
  Commons entry already encodes per-file `license_short_name` and
  `credit` so the same fields are reused for IA entries.

- For `hands_cropped_out`, some plausible candidates will be television
  anchor close-ups. The active prompt Hard Limits forbid YouTube-derived
  media unless explicitly reviewed. Does that limit apply to IA's
  `collection:tv` items that are direct broadcaster uploads rather than
  YouTube re-hosts? Default: treat `collection:tv` as out of scope for
  this discovery and prefer `collection:prelinger` and
  `collection:moviesandfilms` items where rights are clearer.
