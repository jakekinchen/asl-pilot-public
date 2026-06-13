# Human-Action Negative Challenge Source Discovery

Checked at: 2026-05-24T18:55:00Z

## Status

This is source discovery and candidate-strategy evidence only. It is not an
approved dataset-source decision, does not add any new exact-file approval to
`docs/model/dataset-source-register.json`, and does not satisfy final negative
challenge evidence.

It exists because `audit_final_manifests.py` against
`data/manifests/negative-challenge.json` still fails on 13 underfilled
challenge types after the original Wikimedia/CIRA exact-file approval
covered only the four no-person types (`empty_camera`, `no_hands_visible`,
`low_light`, `off_center`). Per
[`docs/model/online-negative-challenge-source-unblock-goal-loop-prompt.md`](../model/online-negative-challenge-source-unblock-goal-loop-prompt.md)
and the user redirect captured in
[`docs/session-logs/052-observer-redirect-online-negative-challenge-sources.md`](../session-logs/052-observer-redirect-online-negative-challenge-sources.md),
this work must use online raw-video sources only; no first-party browser
collection.

## Scope

The 17 `REQUIRED_CHALLENGE_TYPES` in
[`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
(L70-L88) must each be covered by at least 5 reject-only clips
(`MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE`). The 13 underfilled types are:

| Challenge type | Description (negative-challenge intent) | Category |
| --- | --- | --- |
| `casual_non_asl_gesture` | Casual gesture that is not in the 95-vocab module. | gesture |
| `counting` | Finger counting (1-2-3...) that resembles but is not the target sign. | gesture |
| `fingerspelling_like_motion` | Rapid finger movement resembling ASL fingerspelling. | ASL-domain |
| `hand_clap` | Applause / clapping. | gesture |
| `hands_cropped_out` | Person visible without their hands in frame. | framing |
| `idle_hands` | Person on camera with hands at rest, no signing motion. | framing |
| `mouth_touch` | Person touching their mouth (eat/drink/yawn). | framing |
| `non_target_asl_sign` | A real ASL sign that is not one of the 95-vocab labels. | ASL-domain |
| `partial_sign` | An incomplete or aborted attempt at a sign. | ASL-domain |
| `thumbs_up` | Thumbs-up gesture. | gesture |
| `waving` | Hand wave. | gesture |
| `wrong_location` | A real ASL sign performed at the wrong body location. | ASL-domain |
| `wrong_palm_orientation` | A real ASL sign with the wrong palm orientation. | ASL-domain |

## Source family triage

The two approved online lanes in
[`docs/model/dataset-source-register.json`](../model/dataset-source-register.json)
both allow `allowed_for_validation: true` with **exact-file scope only**:

- `wikimedia-commons-negative-challenge-videos`
- `cira-satellite-library-negative-challenge-videos`

The CIRA Satellite Library is satellite imagery and is not viable for any
human-action type. Wikimedia Commons is the only existing approved online lane
that can plausibly carry human-action negative-challenge clips. Adding new
exact-file SHA-256 hashes under the existing
`approved_wikimedia_commons_negative_challenge_exact_files_2026_05_21` decision
is mechanically the same pattern that produced the current 20 approved clips:
extend the candidate selection in
[`scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`](../../scripts/export_wikimedia_commons_negative_challenge_candidates.mjs),
expand `requiredTypes`, download with hash pinning, run the mixed-source
review, and update the source-audit JSON. The current source-register
approval text is permissive enough to cover additional exact files of the same
license/reuse character (CC BY / CC BY-SA / Public-domain / CC0) as long as
each new file's exact SHA-256 lands in the source-audit JSON before manifest
import.

For the 5 ASL-domain types (`fingerspelling_like_motion`, `non_target_asl_sign`,
`partial_sign`, `wrong_location`, `wrong_palm_orientation`), Wikimedia Commons
is unlikely to be a natural source because the negative-challenge intent depends
on knowing which signs are in the 95-vocab module. The plausible online path
for these is to repurpose **already approved** training/validation sources -
`popsign-v1-original-videos`, `asl-citizen-school-assignment-raw-videos`,
`wlasl-school-assignment-raw-videos` - by selecting clips that are not in the
95-label PopSign vocabulary, and labelling them as `non_target_asl_sign` or as
specific failure modes when the existing labels make that semantically
defensible. Those source approvals already cover validation use as well as
training, and the school-assignment exact-source decisions already specify the
raw-RGB no-derived-features constraint that negative-challenge manifests
preserve.

## API probe evidence (gesture and framing types)

The probes below used the Wikimedia Commons MediaWiki API with the same query
shape that
[`scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`](../../scripts/export_wikimedia_commons_negative_challenge_candidates.mjs)
uses. They are *probes*, not selections: every candidate still needs visual
review and exact-file source-rights review before any manifest import.

| Type | Search query | Promising titles found (MIME, size) |
| --- | --- | --- |
| `waving` | `filetype:video waving hand` | `File:HandWaveExample.webm` (webm, 638KB); `File:Amrita Vidyalayam children waving.webm` (webm, 3.1MB); `File:Wave 1 (Converted).ogv` (ogg, 3.9KB) |
| `hand_clap` | `filetype:video applause` | `File:Clapping for the nhs.webm` (webm, 29.9MB); `File:Applaudissements à la Wikiconvention Francophone 2022.webm` (webm, 4.0MB) |
| `counting` | `filetype:video counting fingers` | `File:Woman counting on fingers.webm` (webm, 5.4MB); `File:Finger-counting in Dutch.webm` (webm, 5.7MB) |
| `thumbs_up` | `filetype:video thumbs up gesture` | No clean matches in top-5; needs better query (e.g. `"thumbs up" review` or category browse on `Category:Thumb signals`). |
| `hand_clap` (extra) | `filetype:video hand clap` (not yet probed) | Pending. |
| `idle_hands` | `filetype:video idle hands` | No clean matches; speech/political clips dominate. Better path: lecture/talking-head videos with hands resting. |
| `mouth_touch` | `filetype:video mouth touch` | No clean matches; better path: `eating`, `drinking`, `yawning` queries. |
| `hands_cropped_out` | not yet probed | Plausible queries: `news anchor`, `talking head close up`, `bust shot interview`. |
| `casual_non_asl_gesture` | not yet probed | Plausible queries: `pointing`, `shrug`, `ok gesture`, `nod` - exclude items that fall into another listed gesture. |
| `fingerspelling_like_motion` | `filetype:video fingerspelling` | `File:Armenian Sign Language (ArSL) - մատնախոսություն - fingerspelling.webm` (3.5MB) - actually fingerspelling content; using it as a *negative* challenge is semantically supportable because it is non-ASL fingerspelling and the recognizer must still reject. |

The probes will be widened and pinned with response SHA-256 in the candidate
exporter (the existing pattern from
`scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`). The
purpose of the table above is to demonstrate, before code, that the gesture
and framing types are tractable from Commons under the existing approval umbrella.

## Required follow-up (sequenced slices)

1. **Extend `requiredTypes` and the `selectedCandidates` list** in
   `scripts/export_wikimedia_commons_negative_challenge_candidates.mjs` to
   cover at least the 4 gesture types (`waving`, `hand_clap`, `counting`,
   `thumbs_up`) plus the 3 framing types (`hands_cropped_out`, `idle_hands`,
   `mouth_touch`, `casual_non_asl_gesture`). Run the candidate audit and refine
   queries to satisfy the 5-per-type minimum.
2. **Download candidate clips with hash pinning** via
   `scripts/download_wikimedia_commons_negative_challenge_candidates.mjs`,
   honoring the existing rate-limit handling (`--delay-ms 3000 --retries 6`).
3. **Visual review**: run the existing contact-sheet / packet pipeline
   (`scripts/export_online_negative_challenge_contact_sheets.mjs`,
   `scripts/audit_online_negative_challenge_visual_observations.mjs`) to
   confirm each candidate matches its assigned challenge type and contains no
   prompted-vocabulary sign.
4. **Source-register exact-file extension**: re-run
   `scripts/export_online_negative_challenge_source_review.mjs --write
   --update-register` so the `approved_wikimedia_commons_negative_challenge_exact_files_2026_05_21`
   decision's referenced source-audit JSON includes the new SHA-256 hashes and
   per-file provenance.
5. **ASL-domain types**: in a separate slice, author a focused review for
   `non_target_asl_sign`, `partial_sign`, `fingerspelling_like_motion`,
   `wrong_location`, `wrong_palm_orientation` against already-approved
   `popsign-v1-original-videos`, `asl-citizen-school-assignment-raw-videos`,
   `wlasl-school-assignment-raw-videos`. This requires exact-clip selection
   (not a new source approval) because those approvals already cover
   validation use; the school-assignment / CC BY 4.0 raw-video constraints
   must continue to be respected.
6. **Manifest re-export**: run
   `scripts/export_online_negative_challenge_manifest.mjs` so
   `data/manifests/negative-challenge.json` covers all 17 types with >=5
   clips each.
7. **Final audit chain**:
   - `node scripts/audit_loop_premise.mjs --json`
   - `node scripts/audit_source_register.mjs`
   - `node scripts/audit_no_pretrained_deps.mjs`
   - `node scripts/audit_no_pretrained_artifact_json.mjs`
   - `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json`
   - `node scripts/audit_final_negative_challenge_gap_packet.mjs`

## Hard limits this discovery respects

- No new source approval is introduced in this document; this is research
  evidence only.
- No raw videos are downloaded by this slice; the existing
  `data/external/wikimedia-commons-negative-challenge-videos/raw/` directory
  is not modified.
- No first-party browser-collection prerequisite is implied; the user redirect
  on 2026-05-24 explicitly rules that path out for this unblock.
- The 17-type negative-challenge gate in
  `scripts/evaluate_rawframe_model.py` is not narrowed.
- No pose, landmark, embedding, detector, feature, or pretrained artifact is
  introduced.

## Open questions

- For the ASL-domain types, will the user accept repurposing approved
  PopSign/ASL Citizen/WLASL clips as `non_target_asl_sign` evidence, or does a
  more conservative interpretation require a new external rights review under
  a clearly-distinct decision id? Default: continue under the existing
  validation-eligible scope and surface the decision in
  [`DECISIONS.md`](../../DECISIONS.md) when the slice lands.
- Some Commons matches (`File:Floridian Woman Shot by Deputies After Waving
  Gun ...`) are clearly inappropriate even when the gesture matches. Visual
  review must reject violent / harmful content even when license terms allow
  reuse.
