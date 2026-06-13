# Recognizer v4 — improving the landmark model lifted the recognizer (POSITIVE)

The "improve landmark model" path (chosen after data-only scaling came back flat)
**worked**: better landmarks propagated to a real recognizer gain.

## Landmark model (PCK@0.1, PopSign test)

| model | data | width | PCK |
|---|---|---|---|
| big2 | PopSign | 32 | 0.759 |
| merged | PopSign+ASL Citizen | 32 | 0.763 (data alone ~flat) |
| **merged-w64** | PopSign+ASL Citizen | 64 | **0.778** (L 0.794 / R 0.762) |

Capacity, not data, moved PCK (+0.019). kp_err 0.086 → 0.078.

## Recognizer (PopSign test, 95-way, chance 0.011)

| recognizer | landmarks | data | top-1 | top-5 |
|---|---|---|---|---|
| v2 | big2 | PopSign | 0.176 | 0.439 |
| v3 | big2 | PopSign+AC | 0.183 | 0.450 |
| **v4** | **w64** | **PopSign+AC** | **0.208** | **0.523** |

**v3→v4 differ ONLY in the landmark model** (big2→w64, same data): +0.025 top-1 /
**+0.073 top-5**. v2→v4 total: **+0.032 top-1 / +0.084 top-5** (+18% / +19% rel).

## Takeaways

- The recognizer is **sensitive to landmark quality** — a small PCK gain (0.019)
  propagated to a sizable top-5 gain (0.084). The landmark model is the right
  lever, and it is NOT yet maxed.
- Data quantity alone was flat (v2→v3, and PCK w32 merged); **model capacity** was
  what moved landmark quality, which moved recognition.
- The from-scratch ceiling is softer than feared: clean-MediaPipe landmarks cap
  this vocab at ~0.37 top-1 / ~0.67 top-5, and we are climbing toward it (0.21 /
  0.52 now). Remaining landmark levers: higher heatmap resolution (32→64 — the
  likely biggest PCK lever, finer localization), wider/deeper net, more frames.

Best models: `detector0-hand-landmarks-merged-w64.pt` (landmark),
`recognizer-v4-w64.pt` (recognizer). New tool: `aslcitizen_relabel.py`;
`train_hands_landmarks_heatmap.py` gained `--width`.
