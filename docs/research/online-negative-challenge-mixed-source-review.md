# Online Negative Challenge Mixed Source Review

Checked at: 2026-05-21T00:06:00.000Z

## Decision

The selected mixed Wikimedia/CIRA/ASL-Citizen raw-video files are approved for
ASL Pilot validation-only reject evaluation and pilot evidence, subject to
retained per-file provenance and attribution. This is an engineering
source-rights and provenance review, not legal advice.

This decision is exact-file scoped. It does not approve any upstream source for
broad future downloads, landmarks, embeddings, detectors, features, or
pretrained artifacts. ASL Citizen raw clips are reused only under the existing
noncommercial school-assignment source-register approval, and only as
off-active-module negative-challenge evidence; raw videos, modified videos, and
extracted frames are not redistributed by this repo.

## Scope

- Combined source id: `online-negative-challenge-mixed-wikimedia-cira-v1`
- Wikimedia source id: `wikimedia-commons-negative-challenge-videos`
- CIRA source id: `cira-satellite-library-negative-challenge-videos`
- ASL Citizen source id: `asl-citizen-school-assignment-raw-videos`
- Selected clips: 25
- Required challenge counts: `{"empty_camera":5,"no_hands_visible":5,"low_light":5,"off_center":5,"non_target_asl_sign":5}`
- Source counts: `{"wikimedia-commons-negative-challenge-videos":12,"cira-satellite-library-negative-challenge-videos":8,"asl-citizen-school-assignment-raw-videos":5}`

## Evidence

- Source audit: `docs/research/online-negative-challenge-mixed-source-audit.json`
- Mixed review packet: `docs/review/online-negative-challenge-review-packet.json`
- Contact-sheet observations: `docs/review/online-negative-challenge-contact-sheet-observations.json`
- Wikimedia reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en
- CIRA credit guidance: https://satlib.cira.colostate.edu/credit-media/
- ASL Citizen Microsoft Research license: https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/
- ASL Citizen non-target extraction provenance: `docs/research/asl-citizen-non-target-extracted-clips.json`

## Selected Files

| Candidate | Type | Source | License/Credit | SHA-256 |
| --- | --- | --- | --- | --- |
| `wikimedia-empty-camera-03` | `empty_camera` | `wikimedia-commons-negative-challenge-videos` | CC BY-SA 2.0 | `cfcf02277156d29c5e6879a44b0bf7afe7d8ceb8854c3bb3ee8a718d9c56bea9` |
| `wikimedia-empty-camera-04` | `empty_camera` | `wikimedia-commons-negative-challenge-videos` | Public domain | `6364fd17568dba0affff9c47935b1e5128630445df7bd9de6438f588830fa518` |
| `wikimedia-empty-camera-05` | `empty_camera` | `wikimedia-commons-negative-challenge-videos` | CC BY 2.0 | `035e829482e7ea61cb37e89f5014ba8bce1cacd1790afc0de87ec433673b1bc5` |
| `cira-empty-camera-01` | `empty_camera` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `c8902f732333c4d086595d845ae4e582008ceacf1ac2c69366f491b7c7386919` |
| `cira-empty-camera-02` | `empty_camera` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `aa7dab0314f1f53f2f021aeaa6fb4e509de569cb084e1d6e41abd5d06e9cb2f2` |
| `wikimedia-no-hands-visible-01` | `no_hands_visible` | `wikimedia-commons-negative-challenge-videos` | Public domain | `35ffd6321f832888bb840608bfd7993183c4fa97a2fa9e0947d65d25062ef884` |
| `wikimedia-no-hands-visible-02` | `no_hands_visible` | `wikimedia-commons-negative-challenge-videos` | Public domain | `ee5e422eb5b8b22f41d569116645827ffcda9e0419facfe94a6377bf21d37c96` |
| `wikimedia-no-hands-visible-03` | `no_hands_visible` | `wikimedia-commons-negative-challenge-videos` | Public domain | `dc90259f2100bb34340c611bc8b7f28935ecba6381911942a1ab62a6d97fc2fd` |
| `wikimedia-no-hands-visible-04` | `no_hands_visible` | `wikimedia-commons-negative-challenge-videos` | Public domain | `7bdd8185d12c9fc945aa6ffdf555f4ac755c2a2b7bd61979f9700db418ab1d48` |
| `wikimedia-no-hands-visible-05` | `no_hands_visible` | `wikimedia-commons-negative-challenge-videos` | CC0 | `e96a46f335f599742b1699714f3ab0465bf60d57b8505d97e15ed47153fac2b8` |
| `wikimedia-low-light-01` | `low_light` | `wikimedia-commons-negative-challenge-videos` | CC BY 2.0 | `2401522df8a5eec0a78893b8ad20a40da040fafab94cccb270b281cdd4c7e55c` |
| `wikimedia-low-light-02` | `low_light` | `wikimedia-commons-negative-challenge-videos` | CC BY 3.0 | `157c349bfd76e9c6ab804f5c049e067198c8600f26ea8fedc8b3349b45fd33f7` |
| `wikimedia-low-light-03` | `low_light` | `wikimedia-commons-negative-challenge-videos` | CC BY-SA 4.0 | `543a596ea723e72b9dd3bdc06f559271c2e2dcf3d73cbdde1abb7aad791498ec` |
| `wikimedia-low-light-04` | `low_light` | `wikimedia-commons-negative-challenge-videos` | CC BY-SA 4.0 | `56ad0b963fd8d25f76bf29d29ef9bf2d9852baa8222e6935367d26f5fbebb165` |
| `cira-low-light-01` | `low_light` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `0efd8b5ae4be8aca135d705f2cd7f6945b04fcaa171bebf38f6cc36a5a6b0b1f` |
| `cira-off-center-01` | `off_center` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `79874f165ac4cd0cde5fdc24e282a390cf20ef4e30aeaceaf5513972be50e9dc` |
| `cira-off-center-02` | `off_center` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `136d083b1d4c403cd77cbca8b07949cce8167cb0ec4a84b220539de4c72f46bd` |
| `cira-off-center-03` | `off_center` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `2f01ce2d8dc5e6b0200920bdabe56ed7f249f8a4625b10ae29b558581e170e3f` |
| `cira-off-center-04` | `off_center` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `c007365675543c2a38bcb8e50b6af859897b05bca72754d8f0f3a0aec6bc54ab` |
| `cira-off-center-05` | `off_center` | `cira-satellite-library-negative-challenge-videos` | CIRA/NOAA imagery credit required | `306b091a54ab2759effcec63a802e61d57c60398ec714a4733f2c34a7d5b2020` |
| `asl-citizen-non-target-asl-sign-01` | `non_target_asl_sign` | `asl-citizen-school-assignment-raw-videos` | ASL Citizen noncommercial school-assignment license | `c3277ec68daad8f3dd1f2331313933c99737f2887213222120ea82b655b28066` |
| `asl-citizen-non-target-asl-sign-02` | `non_target_asl_sign` | `asl-citizen-school-assignment-raw-videos` | ASL Citizen noncommercial school-assignment license | `f77c0fb521424b787c6d236eebe927aa1b0f625e5267c6fb82cf4a3c9e031a00` |
| `asl-citizen-non-target-asl-sign-03` | `non_target_asl_sign` | `asl-citizen-school-assignment-raw-videos` | ASL Citizen noncommercial school-assignment license | `221fca0badfd6b373e93e1a0b18bcddbbe8601e5f382cab067c5cea287b11e41` |
| `asl-citizen-non-target-asl-sign-04` | `non_target_asl_sign` | `asl-citizen-school-assignment-raw-videos` | ASL Citizen noncommercial school-assignment license | `7c3dbd2c8631014332e8622bae7dc543e71e618bf18bd53d5acbad7f15d87052` |
| `asl-citizen-non-target-asl-sign-05` | `non_target_asl_sign` | `asl-citizen-school-assignment-raw-videos` | ASL Citizen noncommercial school-assignment license | `b9da388a077d0844186fa7a7afec268ec00d7b3279057ef4c79fcf9bdbfb7b26` |

## Required Follow-Up

1. Generate `data/manifests/negative-challenge.json` from the exact selected files only.
2. Decode raw RGB tensors and retain decode provenance.
3. Run `./.venv/bin/python scripts/audit_final_manifests.py`.
4. Run final evaluation without `--allow-smoke-eval`.
