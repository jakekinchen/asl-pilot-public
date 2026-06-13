# Wikimedia Commons probes for counting + fingerspelling_like_motion

Checked at: 2026-05-24

## Status

Source-discovery probe results only. Not an approved dataset-source decision, does not modify [`docs/model/dataset-source-register.json`](../model/dataset-source-register.json), and does not satisfy final negative-challenge evidence.

This file extends [`docs/research/wikimedia-commons-human-action-negative-challenge-source-discovery.md`](wikimedia-commons-human-action-negative-challenge-source-discovery.md) with additional probe evidence for two of the 13 missing human-action challenge types whose Commons coverage was previously listed as "2 candidates" or "1 candidate".

## Findings

Five Commons CirrusSearch probes via the public API (`commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=<query>&srlimit=30`) returned the following video files (.webm / .ogv / .ogg) for the two types:

| Probe query | Candidate videos found |
| --- | --- |
| `counting fingers` | `File:Woman counting on fingers.webm`, `File:Finger-counting in Dutch.webm` |
| `finger counting demonstration` | 0 video results (PDF/image-only matches) |
| `fingerspelling` | 0 video results in `srlimit=30`; the discovery doc's `File:Armenian Sign Language (ArSL) - մատնախոսություն - fingerspelling.webm` requires a different query path |
| `ASL fingerspelling alphabet` | 0 video results |
| `manual alphabet sign language` | 0 video results |
| `sign language alphabet demonstration` | 0 video results |
| `mathematics counting children` | 0 video results |

A `filetype:video` filter is unsupported by Commons CirrusSearch (returns `totalhits: 0` for every probe), so the namespace=6 + extension-suffix path is the actually-working query shape.

## Implication

Both types fall short of the 5-per-type minimum at the existing Commons source:

- `counting`: 2 candidates against minimum 5 (gap of 3).
- `fingerspelling_like_motion`: 1 candidate against minimum 5 (gap of 4).

The probes above are not exhaustive — other query shapes (e.g., probing specific Commons categories like `Category:Fingerspelling` or `Category:Counting`, browsing language-specific sign-language pages, traversing Commons gallery pages) may surface additional candidates. But based on the simple-search results, **Wikimedia Commons does not appear to have sufficient CC video material to satisfy the 5-per-type minimum for these two types** under straightforward keyword search.

This joins these two types to the decision-required list alongside the existing 3 hard ASL-domain types (`partial_sign`, `wrong_location`, `wrong_palm_orientation`) in [`DECISIONS.md`](../../DECISIONS.md) row #6. The relevant options differ slightly for `counting` / `fingerspelling_like_motion` because they have *some* Commons candidates:

1. **Use the 1-2 Commons candidates and supplement with broader non-Commons CC sources** (e.g., Internet Archive, Vimeo CC-licensed search, dedicated CC educational repositories) — requires new source-register approval for whichever family is chosen.
2. **Lower the per-type minimum from 5 to 2 for these specific types** — requires editing `MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE` in [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py) and `audit_final_manifests.py`; per [`GOAL.md`](../../GOAL.md) `current mission` hard limit, this needs explicit human approval.
3. **Exhaustive Commons category traversal** — non-trivial extra discovery work (manual category browsing of `Category:Fingerspelling`, `Category:Hand counting`, etc.) before another tick can advance.
4. **Defer as documented non-fatal limitation** — same effect as (2) but framed as "Commons video corpus for these gestures is limited; coverage is reported as observed minus the explicit gap".

## Hard limits this research respects

- No new source approval is introduced.
- No raw videos are downloaded.
- The 17-type negative-challenge gate is not narrowed.
- The 5-per-type minimum is not relaxed.
- No first-party collection is implied.
- No pose, landmark, embedding, detector, feature, or pretrained artifact is introduced.

## Open questions

Tracked in [`DECISIONS.md`](../../DECISIONS.md) row #6 update (2026-05-24): whether to extend the 3-hard-type decision to also cover `counting` and `fingerspelling_like_motion`.
