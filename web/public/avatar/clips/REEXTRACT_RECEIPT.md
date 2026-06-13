# Avatar demo-clip re-extraction receipt (ws1-avatar-arms)

Date: 2026-06-10. Scope: the 8 /practice demo words only
(man, please, frog, grandpa, happy, hello, table, bad). No deploy, no push.

## Diagnosis: mocap quality (arms), NOT a retarget bug

`HumanAvatar3D.tsx` data-drives ONLY the 4 arm bones (LeftArm/LeftForeArm/
RightArm/RightForeArm) from `body23` shoulders→elbows→wrists. Hand+finger bones
stay in the rig's bind pose; the `leftHand21`/`rightHand21` tracks are **not read
by the renderer**. So the visible wrongness came from the ARM trajectory, which
was sparse + interpolated because the old clips ran MediaPipe pose at full
1944×2592 (pose-lite detected only ~12–58% of frames → near-static/jerky arms).
The 5 prior `fix(avatar)` commits operated on the hand-landmark track the live
renderer never reads, which is why they didn't change the look.

Retarget/orientation: the arm retarget math is correct. The only handedness issue
was per-clip: `hello` and `grandpa` source signers were captured such that the
moving wrist landed on the data index that renders on the viewer's RIGHT, opposite
the source (viewer-left). Fixed by mirroring those two clips in data (x→−x + swap
L/R joints), so the active hand renders viewer-left like the source — consistent
with the other 6 and with no renderer change / no global mirror toggle.

## What changed

- Re-ran pose at 720px (long side) → 97–100% pose detection per word.
- Selected the best of all 50 PopSign candidates (train+test) per word by pose
  density + arm motion energy + handedness (see ws1-avatar-preview/selected.json).
- Rebuilt each `<word>.v1.json` body23/head with the same layout, normalization,
  smoothing, and schema. fps=30. Hands collapsed to wrist (bind-pose in renderer).
- Updated each clip's `source`, `quality` (honest poseDetectedFrames/Fraction,
  mover, wristAboveShoulderFrac), and `review` (reviewedAsAslDemonstration=false,
  needs human ASL verification).

## Quality before → after (pose-detected frames / sampled)

| word    | OLD       | NEW          | source clip |
|---------|-----------|--------------|-------------|
| man     | 34/60     | 60/60 (1.00) | train/man/4a.6001-man-2022_12_16_00_35_16.615-0.mp4 |
| please  | 33/55     | 84/84 (1.00) | train/please/gtsignstudy4a.8046-please-2023_01_29_22_29_02.522-0.mp4 |
| frog    | 31/61     | 79/79 (1.00) | train/frog/gtsignstudy4a.7041-frog-2023_01_28_21_09_00.009-0.mp4 |
| grandpa | 35/75     | 60/62 (0.97) | train/grandpa/4a.8021-grandpa-2023_01_16_15_44_23.211-0.mp4 |
| happy   | 33/273    | 65/65 (1.00) | test/happy/gtsignstudy4a.8033-happy-2023_01_29_00_00_18.418-0.mp4 |
| hello   | 34/91     | 74/74 (1.00) | train/hello/gtsignstudy4a.8046-hello-2023_01_30_00_33_41.986-0.mp4 (mirrored) |
| table   | 33/72     | 108/108(1.00)| test/table/gtsignstudy4a.8035-table-2023_01_26_18_06_42.124-0.mp4 |
| bad     | 34/112    | 80/81 (0.99) | train/bad/4a.8014-bad-2023_01_07_19_50_31.575-0.mp4 |

## Honesty / open items

- ASL correctness is NOT certified here. Verify by eye via the previews:
  ws1-avatar-preview/gifs/<word>.gif and ws1-avatar-preview/frames/AFTER_<word>.png
  (BEFORE_<word>.png shows the old dead-arm contrast).
- No word required the "all candidates poor" fallback — every word had a 100%-pose
  candidate. If any word still reads wrong to a human, swap to the 2nd/3rd-ranked
  candidate in ws1-avatar-preview/diag/<word>.json or fall back to the source video.
- Extraction scripts: ws1-avatar-preview/{screen_candidates,select_best,
  reextract_avatar_arms,normalize_handedness}.py.
