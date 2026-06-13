# Crop-pixel recognizer — the fork (NEGATIVE): pixels lose to landmarks at PopSign scale

Tested whether a from-scratch CNN+GRU on crop PIXELS beats the landmark
recognizer (0.176 top-1 / 0.44 top-5). It does not — and the failure mode is
informative: **the pixel model is data-starved on PopSign.**

## What was tried

1. **Signing-space crop @64px** (`extract_recognizer_crops.py`): whole upper
   body, hands ~10px → handshape unresolvable. Stuck at chance. Overfit test
   (80 clips) confirmed there is no handshape signal to fit at this crop/res.
2. **Per-hand crops** (`extract_hand_crops.py`): landmark model localizes each
   hand → tight crop from the full-res frame → both hands composited 64×128.
   Visually verified handshape is sharp. 113,904 composites / 7,119 clips.
   - Overfit 80 clips: learns but SLOWLY (0.24 train top-1 at 40 ep).
   - Full data (4,275 train clips), lr 1.5e-3: flat at chance through 15 ep.
   - Full data, lr 3e-3: flat at chance through 30 ep.

## Diagnosis

The model can memorize 80 clips but cannot generalize on 4,275 — the classic
signature of **insufficient data for from-scratch visual feature learning**.
PopSign's ~75 clips/word is far below what a pixel CNN needs to learn transferable
handshape features. Landmark coordinates carry a strong structural prior (21
known keypoints), so they learn a usable mapping from the same small data — which
is exactly why isolated-sign benchmarks (PopSign Kaggle) are landmark-based.

## Verdict

| recognizer | top-1 | top-5 | trains on PopSign? |
|---|---|---|---|
| **landmark (v2, our-models)** | **0.176** | **0.439** | yes, easily |
| crop-pixel (per-hand) | ~chance | ~chance | no (data-starved) |

**The landmark recognizer is the recognizer.** The ceiling is DATA SCALE, not
architecture. The lever that moves it is more in-domain data (e.g., ASL Citizen,
~84k clips, identified in the deep-research) and/or higher landmark quality — not
a different recognizer head on PopSign.

Tools retained: `train_crop_recognizer.py`, `extract_recognizer_crops.py`,
`extract_hand_crops.py` (the per-hand crop pipeline is reusable if/when data scales).
