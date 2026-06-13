# ASL-Domain Negative Challenge Repurposing Research

Checked at: 2026-05-24T19:08:00Z

## Status

This is source-discovery and strategy evidence only. It is not an approved
dataset-source decision, does not add any new exact-file approval to
[`docs/model/dataset-source-register.json`](../model/dataset-source-register.json),
and does not satisfy final negative-challenge evidence.

It exists because Wikimedia Commons has demonstrably sparse coverage of the
ASL-domain challenge types named by
[`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
`REQUIRED_CHALLENGE_TYPES` (L70-L88). The five ASL-domain types are:

- `non_target_asl_sign` - a real ASL sign that is not one of the 95-vocab module labels
- `partial_sign` - an incomplete or aborted attempt at a sign
- `fingerspelling_like_motion` - rapid finger movement resembling ASL fingerspelling
- `wrong_location` - a real ASL sign performed at the wrong body location
- `wrong_palm_orientation` - a real ASL sign performed with the wrong palm orientation

Per
[`docs/research/wikimedia-commons-human-action-negative-challenge-source-discovery.md`](wikimedia-commons-human-action-negative-challenge-source-discovery.md)
"Required follow-up" step 5, these types should be sourced from already-approved
ASL datasets rather than from new external families.

## Approved sources reviewed

Two already-approved sources have local imported clips that can plausibly cover
ASL-domain challenge use under their existing validation-eligible scope:

### `wlasl-school-assignment-raw-videos`

- Source-register decision id: `approved_wlasl_school_assignment_raw_videos_2026_05_21`
- `allowed_for_validation: true`, `allowed_for_pilot_submission: true`,
  `allowed_for_model_training: true`.
- Local selected import: [`docs/research/wlasl-academic-selected-raw-clip-import.json`](wlasl-academic-selected-raw-clip-import.json)
  reports 320 imported clips across 90 distinct ASL labels.
- 68 of those labels overlap with the 95-vocab active module; the remaining
  **22 labels are off-target**:
  `find`, `fine`, `grandma`, `hat`, `horse`, `later`, `listen`, `mad`,
  `make`, `milk`, `morning`, `night`, `not`, `open`, `pencil`, `person`,
  `room`, `say`, `talk`, `time`, and 2 more (full list requires re-running
  the diff against the active-module snapshot).

Off-target WLASL clips are the most direct candidates for `non_target_asl_sign`:
they are real ASL signs, performed correctly, but not part of the 95-label
recognition module. The recognizer must reject them. Headroom is generous; the
manifest needs only 5 per challenge type, and these 22 labels have multiple
clips each.

### `asl-citizen-school-assignment-raw-videos`

- Source-register decision id: `approved_asl_citizen_school_assignment_raw_videos_2026_05_21`
- Same validation/pilot/training scope as WLASL.
- Local selected import: [`docs/research/asl-citizen-selected-raw-clip-import.json`](asl-citizen-selected-raw-clip-import.json)
  reports 494 imported clips across 25 distinct labels.
- Currently all 25 imported labels fall **inside** the 95-vocab active module
  (the imported subset was chosen to cover the active module).
- To use ASL Citizen for ASL-domain challenges, additional off-target clips
  would need to be downloaded from the ASL Citizen archive. The archive
  contains the full ASL Citizen vocabulary (much broader than 95 signs); the
  archive index already lives at
  [`docs/research/asl-citizen-zip-index-probe.json`](asl-citizen-zip-index-probe.json).

### `popsign-v1-original-videos`

- Source-register decision id: `approved_popsign_v1_original_videos_2026_05_20`
- The active import plan
  [`docs/research/popsign-v1-import-plan.json`](popsign-v1-import-plan.json)
  is scoped to the 95-label active module's archives (285 archives = 95
  labels x train/val/test). PopSign v1 has additional categories in the
  original game that fall outside the 95-vocab.
- PopSign-v1 download is gated by Brev / large-archive scheduling and is
  more cumbersome to expand than WLASL or ASL Citizen.

## Type-by-type mapping proposal

| Challenge type | Best online source | Notes |
| --- | --- | --- |
| `non_target_asl_sign` | WLASL off-target labels (22 already imported) | Pick 5 clips across distinct labels. Direct mapping; no new download needed. |
| `partial_sign` | None natural in CC content | Surface as open question. WLASL clips contain natural sign-onset frames, but a "partial sign" challenge requires the clip itself to be aborted/incomplete, which is rare in CC datasets. Possible mitigation: very short trim of an existing approved clip with explicit metadata `partial_sign_method: source_clip_truncated_at_X_seconds`. This is a transformation that may exceed raw-RGB-only constraints; needs user input before the slice lands. |
| `fingerspelling_like_motion` | Wikimedia Commons fingerspelling demonstration video already probed (`File:Armenian Sign Language (ArSL) - մատնախոսություն - fingerspelling.webm`, 3.5MB) or other CC fingerspelling clips | Use as `fingerspelling_like_motion` because the recognizer must reject any fingerspelling that is not the 95-vocab module's recognition target. Needs 5 clips; one is identified, more research needed. |
| `wrong_location` | None natural in CC content | Same constraint as `partial_sign`. Surface as open question. |
| `wrong_palm_orientation` | None natural in CC content | Same constraint as `partial_sign`. Surface as open question. |

## Source-register scope question

The existing WLASL and ASL Citizen `external_rights_review.allowed_use_summary`
text says "approved only for the user's clarified noncommercial school
assignment as local academic/computational raw-RGB training and validation
data". Using off-target clips for **negative-challenge validation** is still
"validation", so the existing scope arguably covers this use without a new
decision id. However, the source register's exact-file approval pattern means
each new clip's SHA-256 must appear in the source-audit JSON before manifest
import.

**Proposed approach for the next slice** (still requires DECISIONS.md ack from
the user or an observer redirect to be load-bearing):

1. Identify 5 specific WLASL off-target clips (from the 22 off-target labels
   already imported and hash-pinned in
   [`docs/research/wlasl-academic-selected-raw-clip-import.json`](wlasl-academic-selected-raw-clip-import.json)).
2. Re-run the negative-challenge source-review pipeline so the source-audit
   JSON includes those SHAs under the existing
   `approved_wlasl_school_assignment_raw_videos_2026_05_21` decision id,
   tagged as `validation_only_negative_challenge_reject_evaluation`.
3. Import as `challenge_type: non_target_asl_sign` clips in
   `data/manifests/negative-challenge.json`.
4. Repeat for `fingerspelling_like_motion` using the identified Commons
   fingerspelling clip plus 4 more (research pending).
5. **Pause and surface** `partial_sign`, `wrong_location`, and
   `wrong_palm_orientation` to the user/observer as an
   `awaiting-observer` wake reason: the 17-type gate may not be strictly
   satisfiable from purely online raw-video sources without either (a) a
   transformation step (clip truncation, frame-skip) that exceeds raw-RGB
   constraints, or (b) a new source family with explicit ASL-error content.
   The discovery doc named this risk in Open Questions; this research note
   confirms it.

## Hard limits this research respects

- No new source approval is introduced in this document; this is research
  evidence only.
- No new clips are downloaded by this slice; existing local imports under
  `data/external/wlasl/raw/` and `data/external/asl-citizen/raw/selected/` are
  not modified.
- No first-party browser-collection prerequisite is implied.
- The 17-type negative-challenge gate is not narrowed.
- No pose, landmark, embedding, detector, feature, or pretrained artifact is
  introduced.
- Raw video clips remain raw RGB only. No transformation (trim, rotate,
  flip, crop) is performed in this research note.

## Open questions to surface in DECISIONS.md / observer messages

1. Does the existing WLASL `approved_wlasl_school_assignment_raw_videos_2026_05_21`
   decision cover `validation_only_negative_challenge_reject_evaluation`
   on its already-imported clips, or do we need a sub-decision id like
   `approved_wlasl_negative_challenge_off_target_2026_05_24`?
2. For `partial_sign`, `wrong_location`, `wrong_palm_orientation`: is the
   user willing to (a) accept a narrower coverage interpretation (e.g.,
   only 3 of 5 clips per type if Commons content is exhausted), (b)
   authorize a clip-truncation / motion-segment transformation step for these
   types, or (c) defer these types and surface them as a non-fatal
   limitation in the final pilot evidence?
3. Does the existing PopSign-v1 import plan need to be extended to download
   off-95 archives if we ever lose access to the WLASL off-target route?

This research note does not answer these questions; it scopes them clearly
enough that the next observer pass or human review can.

---

## Addendum 1 (2026-05-24, post-rollover) — off-target claim falsified

Direct cross-check against
[`data/active-module/vocabulary-active-module.snapshot.json`](../../data/active-module/vocabulary-active-module.snapshot.json)
(`label_count: 95`) shows that **every label this note named as
"off-target" is actually in the active recognition module**. Specifically,
`find`, `fine`, `grandma`, `hat`, `horse`, `later`, `listen`, `mad`, `make`,
`milk`, `morning`, `night`, `not`, `open`, `pencil`, `person`, `room`, `say`,
`talk`, `time` — and every other WLASL label imported under
[`docs/research/wlasl-academic-selected-raw-clip-import.json`](wlasl-academic-selected-raw-clip-import.json)
(`label_count: 90`) — appear as active-module items.

Set arithmetic:

- Active module label IDs: 95 distinct.
- WLASL imported label IDs: 90 distinct; `wlasl_labels \ active_module = {}`.
- ASL Citizen imported label IDs: 25 distinct; `asl_citizen_labels \ active_module = {}`.

Both imported subsets are **strictly inside** the active module. They are
training/validation candidates for the 95-label recognizer, not
`non_target_asl_sign` source candidates.

The "22 off-target labels" listed earlier in this note were derived against
an out-of-date or hypothetical vocabulary, not against the actual active
module snapshot. The recommended mapping `non_target_asl_sign → WLASL
off-target labels (22 already imported)` is therefore **incorrect**, and the
session log 054 "next slice" suggestion #1 (extend WLASL off-target via
`scripts/export_online_negative_challenge_source_review.mjs --write
--update-register`) cannot land as planned — there are no locally-available
off-target clips.

To make `non_target_asl_sign` tractable from approved external sources, a
follow-on slice must:

1. Identify ASL-domain labels outside the 95-label active module (in the
   broader WLASL 2000-label dataset, the broader ASL Citizen archive, or
   Wikimedia Commons ASL demo videos).
2. Verify the source-register decision scope for the chosen source covers
   downloading off-active-module clips (the current WLASL and ASL Citizen
   approvals are scoped to noncommercial school assignment use; this is
   probably already covered, but the exact-file SHA-256 audit pattern still
   requires per-file approval).
3. Download → visual-review → source-audit → manifest import.

This is a multi-slice path, not a one-tick extension.

The
[`docs/session-logs/058-premise-correction-no-off-target-wlasl.md`](../session-logs/058-premise-correction-no-off-target-wlasl.md)
records this correction and the corresponding DECISIONS.md row #6 update.
