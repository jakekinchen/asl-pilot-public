# MS-ASL Source Rights Review

Checked at: 2026-05-21T06:32:00Z

This review is an engineering source-rights and availability note for the ASL
Pilot raw-frame model goal. It is not legal advice, source-register approval,
manifest approval, or model evidence.

## Decision

MS-ASL is still a candidate only. Do not import MS-ASL videos into
`data/manifests/`, `data/external/`, or `data/tensors/` for training yet.

The source is promising enough for a full review because the official metadata
package is hash-pinned locally, provides signer-independent splits, and has
strong overlap with the current ASL Pilot vocabulary. It is not approved yet
because the metadata points to upstream YouTube videos, the C-UDA text includes
no rights warranty for the data, and a small availability probe already found
private/unavailable source videos.

## Evidence

Local MS-ASL metadata package:

| Item | Value |
| --- | --- |
| Download page | `https://www.microsoft.com/en-us/download/details.aspx?id=100121` |
| Local ZIP | `artifacts/dataset-research/ms-asl/MS-ASL.zip` |
| Local ZIP SHA-256 | `a8562008309eea4129e1bc0ed7f654a314fee195227222859657e307b6434c34` |
| README SHA-256 | `dc0d5adc98f24b4c5a13d8ead15d19e9531e68d48a6145b222e5791cf3565322` |
| C-UDA PDF SHA-256 | `88aadb29e93a1799f1d0b4db39bfd0ae5bc4b5fe222acd8e9d231c8dbf7939e3` |
| Pruned vocabulary candidate | `docs/research/ms-asl-pruned-vocabulary-candidate.json` |
| Pruned vocabulary candidate SHA-256 | `65132bb3fc9c1576091c51953bded43f750c38762f4a13a6f03fd349438ed308` |
| Availability probe | `docs/research/ms-asl-availability-probe.json` |
| Full candidate availability probe | `docs/research/ms-asl-pruned-vocabulary-availability-probe.json` |
| Full candidate availability probe SHA-256 | `e92afd7ae302be7a7fa8495a709ba29ac07d77ba93384053e7fcc016cb880dfb` |
| Availability-filtered candidate | `docs/research/ms-asl-availability-filtered-candidate.json` |
| Availability-filtered candidate SHA-256 | `4c193c2692a9d1dd623ee7cccd6bd380b5d2ce76513b9b905736f31e69b12038` |

Current official/source evidence:

- Microsoft Download Center lists `MS-ASL.zip`, version August 2019, date
  published 2024-07-15, file size 1.9 MB.
- The local MS-ASL README says the ZIP contains train/test/validation JSON,
  1,000 gloss classes, synonym mappings, and the C-UDA license discussion PDF.
- The MS-ASL paper reports 25,513 sign-video samples, just over 24 hours of
  video, 222 distinct signers, and signer-independent train/validation/test
  splits.
- The same paper reports that the data was assembled from public ASL videos and
  acknowledges label/noise challenges.

Local C-UDA v0.1 extraction with macOS PDFKit:

- Data may be used, modified, and redistributed for computational use if the
  agreement terms are followed.
- Data itself is restricted to computational use.
- AI models trained on the data are treated as output if they do not include
  more than a de minimis portion of the data.
- The data provider does not warrant that it has rights in the data.

Availability probe:

- Command pattern:
  `uvx --from yt-dlp yt-dlp --simulate --skip-download --no-playlist --quiet --no-warnings --print ... <url>`
- Sample policy: first metadata row for `hello`, `no`, `happy`, `like`, and
  `orange` in each MS-ASL split.
- Result: 15 metadata clips probed, 11 currently public, 2 private, 2
  unavailable, 0 video bytes downloaded.

Full pruned-candidate availability probe:

- Probe command:
  `node scripts/probe_msasl_candidate_availability.mjs --write --concurrency 12 --timeout-ms 15000`
- Probe script SHA-256:
  `f1d6b144b29e7dd0d418d252a46261eddf59a5b8a2dceac7d3732d5d46e31006`
- Probe method: YouTube oEmbed metadata only, no video download.
- Candidate rows probed: 2,606.
- Unique YouTube video IDs probed: 1,002.
- Public oEmbed video IDs: 671.
- Not-public or unavailable video IDs: 331.
- Public rows: 1,842 / 2,606 (`0.7068303914044513`).
- Public row coverage by split: 1,284 / 1,710 train, 301 / 529 validation,
  257 / 367 test.
- Labels still meeting the 20 train / 5 validation / 5 test public-row floor:
  14.

Availability-filtered candidate:

- Export command:
  `node scripts/export_msasl_availability_filtered_candidate.mjs --write`
- Export script SHA-256:
  `5e42ea71af051899990743c7060c8688757f9f29142aa4be905cd1edb3a16277`
- Selected labels: `no`, `happy`, `like`, `orange`, `sad`, `table`, `book`,
  `girl`, `fine`, `sick`, `now`, `dog`, `have`, and `all`.
- Public rows: 368 train, 113 validation, and 92 test.
- Unique public video IDs referenced by the selected rows: 291.
- Decision: useful as reduced-scope research input, but too small to satisfy the
  current 95-label final model goal without explicit scope approval.

Pruned-vocabulary candidate:

- Export command: `node scripts/export_msasl_pruned_vocabulary_candidate.mjs --write`
- Export script SHA-256:
  `80d4ae86819fc0dcc45170b973ff758a42ff9950470aa0ec21351c151ef13e99`
- Selection rule: exact match after lowercase alphanumeric normalization, then
  at least 20 train rows, 5 validation rows, and 5 test rows.
- Selected labels: 50.
- Candidate metadata rows: 1,710 train, 529 validation, and 367 test.
- Overlapping labels below the minimum count rule: 28.
- Current ASL Pilot labels without an exact MS-ASL match: 17.

## Risk Assessment

MS-ASL has a better model-quality shape than the current PopSign-only path:
larger signer count, signer-independent splits, and enough overlap to justify a
50-label pruned pilot review.

The unresolved risks are material:

- The metadata package is not raw video; importing requires fetching and cutting
  upstream YouTube videos.
- Some source URLs are no longer available or are private.
- The C-UDA permissions appear computational-use friendly, but the no-warranty
  clause means the project should not treat this as the same rights posture as
  PopSign CC BY 4.0.
- The source videos were not collected under the same explicit participant
  consent framing as PopSign or ASL Citizen.
- Any browser/demo/submission use needs an explicit decision that model outputs
  from C-UDA-covered YouTube-derived data are acceptable for this project scope.
- Public availability attrition is significant: the deterministic 50-label
  candidate falls to 14 labels that meet the 20/5/5 public-row floor after
  oEmbed probing. This is below the current 95-label final-model scope and also
  below the 50-label reduced dataset that originally made MS-ASL attractive.

## Required Before Approval

1. Do not run a full stronger media-format probe by default; the 14-label scope
   is too small for the current 95-label final model goal.
2. If the user explicitly accepts a 14-label reduced pilot, run a stronger
   media-format probe for those public URLs with `yt-dlp --simulate` before any
   source-register change.
3. Decide whether the project accepts C-UDA computational-use data for model
   training, validation, browser inference, and pilot submission artifacts.
4. If accepted, add a source-register entry limited to available MS-ASL raw-video
   imports and explicitly prohibit raw-video redistribution.
5. Decode only approved raw RGB clips and retain source URL plus clipped-video
   hashes before training.
6. Keep all pretrained MS-ASL models, extracted features, landmarks, detectors,
   and feature caches out of the ASL Pilot recognition path.

## Next Step

Do not approve the 50-label MS-ASL candidate as-is, and do not spend more work
on a full media-format probe unless the project explicitly accepts a 14-label
reduced pilot. For the current goal, the better next move is to treat MS-ASL as
not viable at the current scope and continue with first-party collection,
another rights-approved source, or an explicitly approved scope reduction.
