# Online Negative Challenge Dataset Goal Loop Prompt

## Mission

Find, prune, rights-review, import, decode, and validate an online raw-video
dataset for ASL Pilot reject-only negative challenge evaluation, so the
raw-frame model pipeline can run final evaluation with
`data/manifests/negative-challenge.json` instead of smoke-only evidence.

## Source Of Truth

Order these sources by authority:

1. The user's latest explicit instructions in the active thread.
2. System/developer instructions, including AGENTS.md handling and the no-revert
   rule for user changes.
3. `docs/model/rawframe-model-goal-loop-prompt.md`.
4. `docs/model/negative-challenge-manifest-schema.md`.
5. `docs/model/dataset-source-register.json` and
   `docs/model/dataset-source-register.md`.
6. Current mixed-source candidate evidence:
   `docs/review/online-negative-challenge-review-packet.json`,
   `docs/review/online-negative-challenge-contact-sheet-observations.json`,
   `docs/research/cira-negative-challenge-candidates.json`,
   `docs/research/cira-negative-challenge-downloads.json`, and
   `docs/research/wikimedia-commons-negative-challenge-downloads.json`.
7. Source-specific discovery and review artifacts:
   `docs/research/wikimedia-commons-negative-challenge-source-discovery.md`,
   `docs/research/cira-negative-challenge-source-discovery.md`,
   `docs/review/cira-negative-challenge-review-packet.json`,
   `docs/research/wikimedia-commons-negative-challenge-candidates.json`, and
   `docs/review/wikimedia-commons-negative-challenge-review-packet.json`.
8. Current pipeline scripts:
   `scripts/decode_raw_videos.py`, `scripts/evaluate_rawframe_model.py`,
   `scripts/train_rawframe_model.py`, `scripts/audit_source_register.mjs`,
   `scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs`,
   `scripts/download_wikimedia_commons_negative_challenge_candidates.mjs`,
   `scripts/export_wikimedia_commons_negative_challenge_candidates.mjs`,
   `scripts/export_cira_negative_challenge_candidates.mjs`,
   `scripts/export_online_negative_challenge_review_packet.mjs`,
   `scripts/audit_online_negative_challenge_review_packet.mjs`,
   `scripts/audit_online_negative_challenge_visual_observations.mjs`,
   `scripts/audit_final_manifests.py`, and
   `scripts/run_final_browser_onnx_smoke.mjs`.
9. Current local manifests, tensors, and model artifacts under `data/`,
   `artifacts/rawframe-model/`, and `web/public/model/`.

## Intended Outcome

The repository has a real, hash-pinned
`data/manifests/negative-challenge.json` built from approved online raw videos,
with at least five reviewed clips for each required challenge type
(`empty_camera`, `no_hands_visible`, `low_light`, `off_center`), decoded tensor
artifacts, source-rights evidence, and final evaluation evidence showing the
selected threshold's false-pass rate on the challenge set.

## Acceptance Criteria

- The chosen online source has a source-register entry with approved external
  rights review scoped to negative-challenge validation and pilot evidence.
- The source decision is backed by retained file-level evidence: source page URL,
  original file URL, MIME type, license short name, author/credit, and direct
  source metadata for every candidate file.
- The candidate list is pruned to at least five usable raw-video files for each
  required challenge type, and every retained clip has explicit review approval
  for the assigned challenge type and expected reject outcome.
- The imported files are local raw WebM/Ogg/MP4 videos, hash-pinned by SHA-256, and
  do not include derived pose, landmark, embedding, detector, feature, or
  pretrained outputs.
- `scripts/decode_raw_videos.py --manifest data/manifests/negative-challenge.json`
  produces `relative_frame_tensor_path`, `frame_tensor_sha256`, and replayable
  decode provenance for every challenge clip.
- `./.venv/bin/python scripts/audit_final_manifests.py` passes.
- Final evaluation runs without `--allow-smoke-eval` and includes
  `--challenge-manifest data/manifests/negative-challenge.json`.
- The resulting validation report and calibrated provenance include
  `negative_challenge` manifest evidence, per-type counts, and false-pass rate.
- Docs are updated with exact hashes, metrics, limitations, and any remaining
  blockers.

## Evidence Standard

Before claiming completion, surface:

- changed files and generated artifact paths;
- selected online source, source-register SHA-256, source-audit SHA-256, and
  source-review receipt SHA-256;
- candidate count and final clip count by challenge type;
- downloaded raw-video paths and SHA-256 hashes;
- decoded tensor paths and SHA-256 hashes;
- decode verification output;
- final manifest SHA-256;
- evaluation command, validation report path/hash, calibrated provenance
  path/hash, and negative challenge false-pass rate;
- audit commands run and pass/fail status;
- any unresolved blocker with the exact command or file that proves it.

Do not treat source discovery, AI-generated images, thumbnails, screenshots,
synthetic fixtures, or smoke-mode outputs as final negative challenge evidence.
Generated images from ChatGPT or other image tools may help with planning or
visual review workflows, but they are not a substitute for approved raw-video
source provenance unless the project deliberately adds a separate synthetic-data
policy and final validators enforce it.

## Decision Status

Confirmed requirements:

- The raw-frame/no-pretrained constraint still applies to the challenge set.
- The final challenge set may come from a pruned online dataset if the exact
  files pass source-rights review and manifest validation.
- Wikimedia Commons and CIRA are only candidate sources until the source
  register and file-level evidence approve the exact files.
- The current mixed-source route has 20 downloaded and hash-verified review
  candidates: three Wikimedia `empty_camera`, two CIRA `empty_camera`, five
  Wikimedia `no_hands_visible`, four Wikimedia plus one CIRA `low_light`, and
  five CIRA `off_center`.
- Sampled contact-sheet observations mark the selected 20 clips as strong
  visual candidates and keep two weak Wikimedia `empty_camera` clips excluded,
  but these observations are pruning evidence, not final approval.
- The negative challenge manifest must remain reject-only and signer/source
  disjoint from PopSign train/validation/test evidence.

Assumptions:

- The mixed Wikimedia/CIRA route is the current best candidate because
  Wikimedia download rate limiting left the single-source Commons set
  incomplete, while CIRA supplies hash-pinned MP4 replacements for the missing
  buckets.
- Public-domain or permissively licensed videos without people are preferable
  for this challenge set because they avoid ASL/signing ambiguity.
- A first pass can be small: exactly five clips per required type is enough if
  all final gates pass.

Recommended defaults:

- Prefer short raw video files under 100 MB before larger files.
- Prefer public-domain, CC0, CC BY, or CC BY-SA files with clear author/credit
  metadata.
- Keep the online-source approval validation-only unless a future task needs
  that source for training.
- Store raw downloads under `data/external/<source-id>/raw/` and decoded tensors
  under `data/tensors/negative_challenge/`.

Open questions:

- Should a human reviewer perform the challenge-type approval, or is
  source-curated operator QA acceptable for this pilot evidence?
- Can the exact selected Wikimedia/CIRA files satisfy source-register rights and
  attribution requirements for validation-only pilot evidence?
- Should final browser readiness wait for stronger training metrics after the
  challenge manifest exists?

## Execution Rhythm

1. Inspect the current worktree, source register, manifest schema, and latest
   progress doc.
2. Inspect the current mixed-source review packet and observation evidence:

   ```sh
   node scripts/audit_online_negative_challenge_review_packet.mjs
   node scripts/audit_online_negative_challenge_visual_observations.mjs
   ```

3. If the mixed route remains viable, complete exact-file rights review and
   source-register approval for the selected Wikimedia/CIRA files. Do not
   approve a broad source when only specific files were reviewed.
4. If the mixed route is not viable, query candidate online sources and build a
   file-level candidate list. For the current Wikimedia path, use:

   ```sh
   node scripts/export_wikimedia_commons_negative_challenge_candidates.mjs --write
   node scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs
   ```

5. Prune visually and by source metadata until every required challenge type has
   at least five reviewed candidates.
6. Add or update source-register evidence only for the exact approved source
   scope.
7. Download and hash approved raw videos. For the current Wikimedia path, use:

   ```sh
   node scripts/download_wikimedia_commons_negative_challenge_candidates.mjs --write --delay-ms 3000 --retries 6
   ```

   Treat HTTP 429 rate limiting as an external download blocker, not as final
   evidence.
8. Generate and decode `data/manifests/negative-challenge.json`.
9. Run final manifest, evaluation, export, browser, and readiness gates.
10. Update progress docs and compare evidence against the acceptance criteria.

## Progress Ledger

Use this compact format in updates:

```text
Current state:
Completed:
Evidence:
Remaining:
Blockers:
Next step:
```
