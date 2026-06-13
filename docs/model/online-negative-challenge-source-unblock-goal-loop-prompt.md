# Online Negative-Challenge Source Unblock Goal Loop Prompt

Mission 3 online-source remediation slice. Active only when referenced from [`GOAL.md`](../../GOAL.md).

## Mission

Unblock the final negative-challenge manifest using **online-source raw videos only**. The user clarified on 2026-05-24 that this project should not wait for first-party browser collection; the orchestrator must reorient from the prior first-party STOP to an online-source-only path.

The immediate blocker is `audit_final_manifests.py` failing because `data/manifests/negative-challenge.json` has 20 clips covering only 4 of the 17 required challenge types. The missing 13 types are:

- `casual_non_asl_gesture`
- `counting`
- `fingerspelling_like_motion`
- `hand_clap`
- `hands_cropped_out`
- `idle_hands`
- `mouth_touch`
- `non_target_asl_sign`
- `partial_sign`
- `thumbs_up`
- `waving`
- `wrong_location`
- `wrong_palm_orientation`

Find, review, download/import, and manifest online raw-video clips for these types under the existing source-register standard. Do not use first-party browser recordings, `data/asl-pilot-store.json`, signer consent receipts, or the first-party collection UI as prerequisites for this mission.

## Current Redirect

The immediate next implementation slice is **fresh-thread Internet Archive contact-sheet and observations extension after `e0cbd13` / observer context-rollover commit `245c17a`**, not Brev training, not manifest export, not decode, not another download, and not another source-review pass.

Reason: the IA broader-source path has now advanced through:

- `e3a865a` / [`docs/session-logs/105-internet-archive-source-review.md`](../session-logs/105-internet-archive-source-review.md): exact-file source review for 10 IA candidates.
- `d3ec90c` / [`docs/session-logs/106-internet-archive-rights-review-receipt.md`](../session-logs/106-internet-archive-rights-review-receipt.md): pre-download rights-review receipt for 7 `approve_pending` candidates.
- `9738c2a` / [`docs/session-logs/107-internet-archive-candidates-json.md`](../session-logs/107-internet-archive-candidates-json.md): downloader-ready candidate JSON for 2 `hand_clap` and 5 `hands_cropped_out` candidates.
- `44aa6a7` / [`docs/session-logs/110-internet-archive-downloader-script.md`](../session-logs/110-internet-archive-downloader-script.md): IA downloader script authored with one-at-a-time download, IA MD5 verification, SHA-256 propagation, and `--max-new-downloads`.
- `27578c5`, `0b1cc3f`, `3fb9cee`, and `9d3a774`: downloads #1-#4 completed and committed with matching updates to [`docs/research/internet-archive-negative-challenge-downloads.json`](../research/internet-archive-negative-challenge-downloads.json), [`docs/research/internet-archive-negative-challenge-candidates.json`](../research/internet-archive-negative-challenge-candidates.json), and [`docs/research/internet-archive-negative-challenge-external-rights-review-receipt.json`](../research/internet-archive-negative-challenge-external-rights-review-receipt.json).
- `0cf9bf8`, `5151296`, and `e5ffd7e`: downloads #5-#7 completed and committed with matching local SHA-256 updates. The IA download lane is now closed end-to-end.
- `01d7d3f` / [`docs/session-logs/119-internet-archive-source-register.md`](../session-logs/119-internet-archive-source-register.md): source-register entry `internet-archive-negative-challenge-videos` plus receipt status flip to `approved_for_this_pilot`.
- `4a8ed71` / [`docs/session-logs/120-internet-archive-review-packet-exporter.md`](../session-logs/120-internet-archive-review-packet-exporter.md): IA per-source review-packet exporter and [`docs/review/internet-archive-negative-challenge-review-packet.json`](../review/internet-archive-negative-challenge-review-packet.json) with 7 clips, all `needs_visual_review`, `blockers=[]`.
- [`docs/session-logs/121-loop-exit-context-rollover.md`](../session-logs/121-loop-exit-context-rollover.md): the Claude thread exited pre-emptively at context-health warning before wiring the IA per-source packet into the combined online packet.
- `e0cbd13` / [`docs/session-logs/123-online-review-packet-includes-ia.md`](../session-logs/123-online-review-packet-includes-ia.md): combined exporter wiring landed. The combined packet now has 4 source packets, 40 selected clips, and `node scripts/audit_online_negative_challenge_review_packet.mjs` passes.
- `245c17a` / [`docs/session-logs/124-loop-exit-context-rollover.md`](../session-logs/124-loop-exit-context-rollover.md): the old thread exited again for context rollover before contact-sheet work.

The next fresh Claude loop should:

1. Read `GOAL.md`, this prompt, session logs `123` through `125`, [`docs/review/online-negative-challenge-review-packet.json`](../review/online-negative-challenge-review-packet.json), [`docs/review/internet-archive-negative-challenge-review-packet.json`](../review/internet-archive-negative-challenge-review-packet.json), [`docs/review/online-negative-challenge-contact-sheet-observations.json`](../review/online-negative-challenge-contact-sheet-observations.json), and [`scripts/export_online_negative_challenge_contact_sheets.mjs`](../../scripts/export_online_negative_challenge_contact_sheets.mjs).
2. Extend [`scripts/export_online_negative_challenge_contact_sheets.mjs`](../../scripts/export_online_negative_challenge_contact_sheets.mjs) for `internet-archive-*` candidate ids, sampling frames from the local raw videos under `data/external/internet-archive-negative-challenge-videos/raw/`.
3. Generate contact sheets for the 7 IA candidates. The 3 currently selected IA clips in the combined packet are the immediate manifest blockers, but the 4 non-selected IA clips should have contact sheets too so they are available for swaps if visual review rejects a selected clip.
4. Refresh [`docs/review/online-negative-challenge-contact-sheet-observations.json`](../review/online-negative-challenge-contact-sheet-observations.json) with IA observations.
5. Run `node scripts/audit_online_negative_challenge_visual_observations.mjs`; it must pass before committing.
6. Commit the contact-sheet exporter / observations changes with a session log named `docs/session-logs/126-internet-archive-contact-sheets.md`.
7. Keep the final manifest rule strict: **no selected clip enters `data/manifests/negative-challenge.json` unless that exact selected `candidate_id` has `visual_status: "strong_visual_candidate"`** in the current visual observations. Do not admit `needs_human_review`, lower the 5-per-type minimum, weaken the 17-type gate, or start manifest export / decode in this slice.

Expected result for this recovery phase: the 3 selected IA clips move from `not_observed_in_prior_contact_sheet` toward `strong_visual_candidate` with retained contact-sheet evidence. If one or more selected IA clips fails visual review, rerank/regenerate the combined packet in a separate follow-up slice using observed IA spares before manifest export. Observer validation notes that `audit_final_manifests.py` now first stops on stale final-manifest `source_register.sha256` values after the IA source-register update; that hash refresh belongs to the later manifest-export slice (use `scripts/export_online_negative_challenge_manifest.mjs --write --refresh-existing-manifests` once visual evidence allows manifest export), not to this contact-sheet slice. `hand_clap` still has only 2 IA candidates against a target of 4 strong; if visual review cannot close that gap, expand IA probe-2 page 2 before switching source families. After `hand_clap` and `hands_cropped_out` converge, continue broader open/research-source discovery for the six remaining Commons-constrained types (`casual_non_asl_gesture`, `counting`, `fingerspelling_like_motion`, `idle_hands`, `mouth_touch`, `thumbs_up`) under DECISIONS row #6 option `(a-2)`. Leave the three hard ASL-domain types (`partial_sign`, `wrong_location`, `wrong_palm_orientation`) for a later observer/user decision unless natural online examples are found during source discovery. Do not train, evaluate, export ONNX, promote a model card, or weaken the 17-type gate while `audit_final_manifests.py` still fails.

## Source Of Truth

Order these by authority:

1. User instruction on 2026-05-24: use online sources, not first-party collection, for this unblock.
2. User clarification on 2026-05-24: use GPT Pro / OpenAI API research when locating sources by detailed specs; this is a noncommercial academic research project, so open/public/CC/public-domain/noncommercial/research-only raw-video datasets are valid candidates. Record source terms and limits, but do not over-block on licensing unless terms plainly prohibit local academic research use.
3. [`GOAL.md`](../../GOAL.md), especially the current mission redirect and the no-pretrained/browser-first constraints.
4. [`docs/model/dataset-source-register.json`](dataset-source-register.json). Approved online sources and exact-file scopes are authoritative. Do not import a new source into manifests until the source register and supporting rights-review artifacts approve the exact scope.
5. Research-assisted source discovery:
   - [`artifacts/research/observer-067-source-discovery/source-discovery-memo.md`](../../artifacts/research/observer-067-source-discovery/source-discovery-memo.md) — OpenAI API web-research memo for broader open/research raw-video sources covering the Commons-constrained and hard ASL-domain negative-challenge types.
6. Existing online-source evidence:
   - [`docs/review/online-negative-challenge-final-review.json`](../review/online-negative-challenge-final-review.json)
   - [`docs/research/online-negative-challenge-mixed-source-audit.json`](../research/online-negative-challenge-mixed-source-audit.json)
   - [`docs/research/wikimedia-commons-negative-challenge-candidates.json`](../research/wikimedia-commons-negative-challenge-candidates.json)
   - [`docs/research/wikimedia-commons-negative-challenge-downloads.json`](../research/wikimedia-commons-negative-challenge-downloads.json)
   - [`docs/research/asl-citizen-non-target-extracted-clips.json`](../research/asl-citizen-non-target-extracted-clips.json)
   - [`docs/review/asl-citizen-non-target-negative-challenge-review-packet.json`](../review/asl-citizen-non-target-negative-challenge-review-packet.json)
   - [`docs/review/online-negative-challenge-review-packet.json`](../review/online-negative-challenge-review-packet.json)
   - [`docs/review/online-negative-challenge-contact-sheet-observations.json`](../review/online-negative-challenge-contact-sheet-observations.json)
   - [`docs/research/cira-negative-challenge-candidates.json`](../research/cira-negative-challenge-candidates.json)
   - [`docs/research/nvidia-asl-source-rights-review.md`](../research/nvidia-asl-source-rights-review.md)
   - [`docs/research/ms-asl-pruned-vocabulary-candidate.json`](../research/ms-asl-pruned-vocabulary-candidate.json)
   - [`docs/research/internet-archive-negative-challenge-source-review.md`](../research/internet-archive-negative-challenge-source-review.md)
   - [`docs/research/internet-archive-negative-challenge-external-rights-review-receipt.json`](../research/internet-archive-negative-challenge-external-rights-review-receipt.json)
   - [`docs/research/internet-archive-negative-challenge-candidates.json`](../research/internet-archive-negative-challenge-candidates.json)
   - [`docs/research/internet-archive-negative-challenge-downloads.json`](../research/internet-archive-negative-challenge-downloads.json)
7. Existing scripts for online-source review/import:
   - `scripts/export_online_negative_challenge_source_review.mjs`
   - `scripts/export_online_negative_challenge_review_packet.mjs`
   - `scripts/audit_online_negative_challenge_review_packet.mjs`
   - `scripts/export_online_negative_challenge_contact_sheets.mjs`
   - `scripts/audit_online_negative_challenge_visual_observations.mjs`
   - `scripts/export_online_negative_challenge_manifest.mjs`
   - `scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`
   - `scripts/download_wikimedia_commons_negative_challenge_candidates.mjs`
   - `scripts/download_internet_archive_negative_challenge_candidates.mjs`
   - `scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs`
   - `scripts/audit_wikimedia_commons_negative_challenge_downloads.mjs`
   - `scripts/audit_source_register.mjs`
   - `scripts/audit_final_manifests.py`
8. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially `#arch-no-pretrained`, `#arch-data-provenance`, `#arch-first-party-data` including the explicit-rights-review clause, and `#arch-storage-policy`.

## Acceptance Criteria

All must be true before this slice closes:

1. `GOAL.md` and this prompt no longer tell the loop to wait for first-party collection for the negative-challenge unblock.
2. Every new negative-challenge clip used by `data/manifests/negative-challenge.json` has online source provenance: source page URL, original file URL or dataset record, license/terms evidence, author/credit where required, local raw-video path, SHA-256, and source-register decision.
3. Source-register scope is exact and explicit:
   - reuse already approved online sources when their scope covers the clip; or
   - add/update source-review artifacts and `docs/model/dataset-source-register.json` before manifest import.
4. The manifest covers all 17 required challenge types with at least 5 clips per type and remains raw-video/raw-frame only. No pose, landmark, embedding, detector, feature, or pretrained artifacts enter the promoted lane.
5. These checks pass:
   - `node scripts/audit_loop_premise.mjs --json`
   - `node scripts/audit_source_register.mjs`
   - `node scripts/audit_no_pretrained_deps.mjs`
   - `node scripts/audit_no_pretrained_artifact_json.mjs`
   - `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json`
   - `node scripts/audit_final_negative_challenge_gap_packet.mjs` reports coverage ready or the session log explains why it is no longer the active packet.

## Hard Limits

- Do not collect or require first-party browser clips for this mission.
- Do not weaken the 17-type negative-challenge coverage gate unless the user explicitly asks.
- Do not approve broad source families by implication. Research passes may identify source families, but manifest import still needs exact source-register scope, per-clip provenance, local path, SHA-256, and visual review.
- Do not treat noncommercial, research-only, public-domain, CC, or stock-license terms as blockers by default for this school research project. Record terms and redistribution limits; block only when terms plainly conflict with local academic research use or raw-video retention.
- Do not use YouTube-derived media unless the source-register review explicitly approves the exact school-project scope and local raw-video handling.
- Do not proceed to Brev training, evaluation, ONNX export, or model-card promotion until `audit_final_manifests.py` passes.

## Execution Rhythm

1. Read `GOAL.md`, this prompt, `docs/model/dataset-source-register.json`, latest session logs 123-125, and `git status`.
2. Run `node scripts/audit_loop_premise.mjs --json`. It must pass before implementation.
3. Recompute the current negative-challenge gap from `data/manifests/negative-challenge.json`.
4. Prefer the Current Redirect first. The current IA step is contact-sheet / observation evidence now that the combined packet includes IA and packet audit passes; do not jump to manifest export or training before the exact selected IA clips have strong visual-observation evidence. For later source families, use GPT Pro / OpenAI API research when needed to locate broader open/research raw-video sources, save the research artifact under `artifacts/research/observer-NNN-*`, then create a narrow source-review/source-register slice before media import.
5. For Commons-constrained types, default to broader open/research-source discovery before considering gate relaxation. Candidate source families already surfaced by API research include 20BN-Jester, EgoGesture/NVGesture, ChicagoFSWild, How2Sign, RWTH-PHOENIX, Internet Archive/Prelinger, Pond5 Public Domain, CDC b-roll, Pexels, and Pixabay; each still needs exact-source review before import.
6. Download or reference only raw online videos with retained provenance. Keep raw videos and tensors out of git.
7. Export/review contact sheets or equivalent visual evidence for each candidate clip.
8. Export the refreshed negative-challenge manifest and decode tensors.
9. Run the audit chain above. Commit each completed slice with a session log.
10. When final manifests pass, continue Mission 3 at the decode-replay/training handoff described in `rawframe-first-training-goal-loop-prompt.md`.

## Progress Ledger

Use this compact format at the bottom of each session log:

```text
Current state:
Completed:
Evidence:
Remaining:
Blockers:
Next step:
Checkpoint commit:
```

## History

- 2026-05-24 — Observer redirect after `d15510f` updated the current redirect from the broad ASL Citizen manifest-export lane to the concrete contact-sheet/visual-observations slice after `f8fa207` and `1899841` put the five ASL Citizen clips into the source-specific and combined review packets. See [`docs/session-logs/075-observer-redirect.md`](../session-logs/075-observer-redirect.md).
- 2026-05-24 — Observer redirect after `823ad8b` updated the current redirect from contact-sheet/visual-observations to manifest export plus decode after `cbaf1c4` closed the 25-clip contact-sheet/observation gate. See [`docs/session-logs/078-observer-redirect.md`](../session-logs/078-observer-redirect.md).
- 2026-05-24 — Observer/user resume after the ASL Citizen lane closed updates the current redirect to post-ASL-Citizen online source continuation and fixes the process helpers so fresh Claude rollover starts as a singleton. See [`docs/session-logs/087-observer-redirect-process-singleton.md`](../session-logs/087-observer-redirect-process-singleton.md).
- 2026-05-24 — Observer redirect after `c5f8129` updated the current redirect from Commons cooldown/download work to the Commons visual-review + manifest-export chain after `8432439` closed 39/39 candidate downloads. See [`docs/session-logs/092-observer-redirect.md`](../session-logs/092-observer-redirect.md).
- 2026-05-25 — Observer redirect after `d6b768c` updated the current redirect from manifest export to selected-clip visual-evidence convergence after `095` showed the exporter blocked on 7 `needs_human_review` observations. See [`docs/session-logs/096-observer-redirect.md`](../session-logs/096-observer-redirect.md).
- 2026-05-25 — Observer redirect after `fb917b2` updated the current redirect for a fresh Claude context rollover and the post-denser-sampling state: `waving` converged, `hands_cropped_out` needs the `09` spare, and `hand_clap` needs stronger replacements or broader source discovery. See [`docs/session-logs/098-observer-redirect.md`](../session-logs/098-observer-redirect.md).
- 2026-05-25 — Observer redirect after `82097e8` updated the current redirect to broader open/research-source acquisition after the Commons `hands_cropped_out` spare pool was exhausted and the current Claude thread entered context-health warning. See [`docs/session-logs/100-observer-redirect-broader-source-discovery.md`](../session-logs/100-observer-redirect-broader-source-discovery.md).
- 2026-05-25 — Observer redirect after `9b65059` updated the current redirect to the concrete IA per-item metadata + exact-file source-review slice after source-discovery and API probes landed and the Claude thread exited pre-emptively at context-health warning. See [`docs/session-logs/104-observer-redirect.md`](../session-logs/104-observer-redirect.md).
- 2026-05-25 — Observer redirect after `9738c2a` updated the current redirect to IA downloader support after source-review, rights-review receipt, and downloader-ready candidate JSON landed and the Claude thread crossed the hard context rollover threshold. See [`docs/session-logs/109-observer-redirect.md`](../session-logs/109-observer-redirect.md).
- 2026-05-25 — Observer redirect after `9d3a774` updated the current redirect from downloader support to the three remaining IA singleton downloads after downloads #1-#4 populated local hash evidence. See [`docs/session-logs/113-observer-redirect.md`](../session-logs/113-observer-redirect.md).
- 2026-05-25 — Observer redirect after `e5ffd7e` updated the current redirect from IA downloads to source-register entry plus receipt status flip after 7/7 selected IA files had verified local SHA-256 evidence. See [`docs/session-logs/118-observer-redirect.md`](../session-logs/118-observer-redirect.md).
- 2026-05-25 — Observer redirect after `4a8ed71` / `78ac380` updated the current redirect from completed IA source-register/per-source packet work to the combined online review-packet wiring slice. See [`docs/session-logs/122-observer-redirect.md`](../session-logs/122-observer-redirect.md).
- 2026-05-25 — Observer redirect after `e0cbd13` / `245c17a` updated the current redirect from combined-packet wiring to IA contact-sheet and observations evidence. See [`docs/session-logs/125-observer-redirect.md`](../session-logs/125-observer-redirect.md).
