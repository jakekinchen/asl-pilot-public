# Wikimedia Commons probes for thumbs_up + idle_hands + mouth_touch + hands_cropped_out + casual_non_asl_gesture

Checked at: 2026-05-24

## Status

Source-discovery probe results only. Not an approved dataset-source decision, does not modify [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json), and does not satisfy final negative-challenge evidence.

This file extends [`docs/research/wikimedia-commons-human-action-negative-challenge-source-discovery.md`](wikimedia-commons-human-action-negative-challenge-source-discovery.md) and [`docs/research/wikimedia-commons-counting-fingerspelling-probe-results.md`](wikimedia-commons-counting-fingerspelling-probe-results.md) with probe evidence for five of the 13 missing human-action challenge types whose Commons coverage had not been measured beyond the original `srlimit=5` discovery.

## Findings

Twenty-one Commons CirrusSearch probes via the public API (`commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=<query>&srlimit=30`) returned the following video files (.webm / .ogv / .ogg / .mp4) across ~600 distinct File: results.

### `thumbs_up`

| Probe query | Video candidates found |
| --- | --- |
| `thumbs up gesture` | 0 video results |
| `thumbs up` | 0 video results |
| `thumb signal` | 0 video results |
| `thumbs up video` | 1 video result: `File:My SARAH G INTERVIEW experience (raw video).webm` — keyword bait (matches "raw video"); not a thumbs-up demonstration |
| `thumb example gesture` | 0 video results |
| `approval gesture thumb` | 0 video results |

After 6 probes across 180 distinct results, **0 viable Commons video candidates** were surfaced for `thumbs_up`. The one .webm match contains an interview, not a thumbs-up gesture.

### `idle_hands`

| Probe query | Video candidates found |
| --- | --- |
| `idle hands` | 0 video results |
| `lecture presentation` | 0 video results (note: 3.9M total hits, dominated by JPG / PDF) |
| `talking head interview` | 1 video result: `File:Interview with Naomi Klein at The World Transformed.webm` — long political interview; hands may be in/out of frame |
| `seated speaker lecture` | 0 video results |
| `news presenter talking` | 1 video result: `File:Medvedev talk 30 November 2017.webm` — political speech; hands may be in/out of frame |
| `person sitting talking camera` | 0 video results |

After 6 probes across 180 distinct results, **2 candidate .webm files** were surfaced for `idle_hands`. Both are long-form political talks where the speaker's hands are not the focus; whether either could be cut into 5 distinct ≥5s clips that genuinely depict "idle hands" requires manual visual review and is dataset-quality fragile.

### `mouth_touch`

| Probe query | Video candidates found |
| --- | --- |
| `eating drinking` | 0 video results (103,732 total hits dominated by signage / geographic photos) |
| `yawning person` | 0 video results |
| `drinking water person` | 0 video results |
| `face touch gesture` | 0 video results |

After 4 probes across 120 distinct results, **0 viable Commons video candidates** were surfaced for `mouth_touch` under simple keyword search.

### `hands_cropped_out`

| Probe query | Video candidates found |
| --- | --- |
| `bust shot portrait` | 0 video results |
| `news anchor` | 0 video results |
| `studio host interview` | **9 .webm files**: NASA Interview Opportunity B-roll clips (Earth Day + Summer Solstice live-shot packets) — e.g., `File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - John Bolten 2023 EarthDay Interview).webm`, plus 8 sibling variants (canned / graphics / no-graphics versions for John Bolten + Lesley Ott; one Alex Young Summer-Solstice clip; one summer-solstice broll-HQ). NASA-produced public-domain clips with head-and-shoulders studio framing. |
| `headshot talking` | 0 video results |

After 4 probes across 120 distinct results, **9 candidate .webm files** were surfaced for `hands_cropped_out` — all from a single NASA studio-interview B-roll package. This is the only one of the 5 types probed in this round that meets the ≥5-per-type minimum from Commons keyword search. Quality is contingent on visual review (NASA "Interview Opportunity" clips are head-and-shoulders studio talking heads; whether the hands stay out of frame in every clip needs visual confirmation), and the candidates all originate from a single source / event; that may or may not satisfy a "5 distinct clips" interpretation depending on whether near-duplicates count.

### `casual_non_asl_gesture`

| Probe query | Video candidates found |
| --- | --- |
| `pointing gesture` | 1 .ogv: `File:Domestic-Dogs-Use-Contextual-Information-and-Tone-of-Voice-when-following-a-Human-Pointing-Gesture-pone.0021676.s001.ogv` — scientific paper supplementary video about dog comprehension; not a clean human-gesture demo |
| `shrug nod gesture` | 0 video results |
| `peace sign hand` | 0 video results |
| `ok sign hand gesture` | 0 video results |

After 4 probes across 120 distinct results, **0–1 viable Commons video candidates** were surfaced for `casual_non_asl_gesture` under simple keyword search.

A `filetype:video` filter is unsupported by Commons CirrusSearch (consistent with the prior probe doc), so the namespace=6 + extension-suffix path is the actually-working query shape.

## Implication

Four of the five types fall short of the 5-per-type minimum at the existing Commons source under straightforward keyword search; one type (`hands_cropped_out`) meets it:

| Type | Candidates found | Gap to minimum 5 | Status |
| --- | --- | --- | --- |
| `thumbs_up` | 0 viable | -5 | Commons-constrained → decision-required |
| `idle_hands` | 2 weak | -3 | Commons-constrained → decision-required |
| `mouth_touch` | 0 | -5 | Commons-constrained → decision-required |
| `hands_cropped_out` | 9 (NASA studio B-roll) | +4 | Likely tractable; next slice = visual review + exporter extension |
| `casual_non_asl_gesture` | 0-1 (scientific-paper supplement) | -4 | Commons-constrained → decision-required |

The probes above are not exhaustive — exhaustive Commons category traversal (e.g., `Category:Thumb signals`, `Category:Hand gestures`, `Category:Lectures`, `Category:Talking heads`, `Category:Eating`, `Category:Drinking`) may surface additional candidates that keyword search misses. But based on the simple-search results, **Wikimedia Commons does not appear to have sufficient CC video material to satisfy the 5-per-type minimum for four of these five types** under straightforward keyword search.

### Recommended next slices (separate from this probe write-up)

1. **Visually review the 9 NASA `hands_cropped_out` candidates** to confirm head-and-shoulders framing keeps hands out of frame in each clip, then extend [`scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`](../../scripts/export_wikimedia_commons_negative_challenge_candidates.mjs) `requiredTypes` + `selectedCandidates` and regenerate [`docs/research/wikimedia-commons-negative-challenge-candidates.json`](wikimedia-commons-negative-challenge-candidates.json). Re-run [`scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs`](../../scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs).
2. After the candidate JSON updates pass, run [`scripts/download_wikimedia_commons_negative_challenge_candidates.mjs`](../../scripts/download_wikimedia_commons_negative_challenge_candidates.mjs) (with the existing `--delay-ms 3000 --retries 6` rate-limit handling) and the contact-sheet / visual-observations pipeline.
3. Re-export the negative-challenge manifest and re-run [`scripts/audit_final_manifests.py`](../../scripts/audit_final_manifests.py) to confirm `hands_cropped_out` moves from underfilled to filled.

The 4 newly-Commons-constrained types (`thumbs_up`, `idle_hands`, `mouth_touch`, `casual_non_asl_gesture`) join the decision-required list alongside the existing 3 hard ASL-domain types (`partial_sign`, `wrong_location`, `wrong_palm_orientation`) and the 2 already-Commons-constrained types (`counting`, `fingerspelling_like_motion`) in [`DECISIONS.md`](../../DECISIONS.md) row #6. The relevant options mirror those already enumerated for `counting` / `fingerspelling_like_motion`:

1. **Use the 0-2 Commons candidates and supplement with broader non-Commons CC sources** (e.g., Internet Archive, Vimeo CC-licensed search, dedicated CC educational repositories) — requires new source-register approval for whichever family is chosen.
2. **Lower the per-type minimum from 5 to 2 for these specific types** — requires editing `MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE` in [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py) and `audit_final_manifests.py`; per [`GOAL.md`](../../GOAL.md) `current mission` hard limit, this needs explicit human approval.
3. **Exhaustive Commons category traversal** — non-trivial extra discovery work (manual category browsing of `Category:Thumb signals`, `Category:Lectures`, `Category:Eating`, etc.) before another tick can advance.
4. **Defer as documented non-fatal limitation** — same effect as (2) but framed as "Commons video corpus for these gestures is limited; coverage is reported as observed minus the explicit gap".

## Hard limits this research respects

- No new source approval is introduced.
- No raw videos are downloaded.
- The 17-type negative-challenge gate is not narrowed.
- The 5-per-type minimum is not relaxed.
- No first-party collection is implied.
- No pose, landmark, embedding, detector, feature, or pretrained artifact is introduced.

## Open questions

Tracked in [`DECISIONS.md`](../../DECISIONS.md) row #6 update (2026-05-24): whether to extend the existing decision-required list to also cover `thumbs_up`, `idle_hands`, `mouth_touch`, and `casual_non_asl_gesture`.
