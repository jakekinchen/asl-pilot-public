# Hint Authoring Guide

## principle

A failed or uncertain attempt should receive a targeted, teachable hint instead of only `incorrect`.

## hint sources

- sign metadata: handshape, movement, location, orientation, timing;
- capture quality: too far, too close, hands out of frame, low light;
- model outcome: wrong class, low confidence, small margin, unsupported sign;
- active module confusions: common pair-specific hints when evidence exists.

## metadata shape

```json
{
  "gloss": "book",
  "displayPrompt": "BOOK",
  "recognitionStatus": "active",
  "hints": {
    "framing": "Keep both hands visible in the camera frame.",
    "movement": "Focus on the opening movement of the sign.",
    "location": "Start near the center of your signing space.",
    "orientation": "Check palm orientation before repeating.",
    "timing": "Sign at a steady pace, not too fast."
  }
}
```

## fail reason mapping

| reason | hint priority |
|---|---|
| `camera_low_light` | framing/lighting hint |
| `hands_out_of_frame` | framing hint |
| `unsupported_prompt` | content-only explanation |
| `low_confidence` | sign-specific general cue |
| `small_margin` | confusion pair cue if known |
| `wrong_top1` | sign-specific movement/location cue |
| `hard_negative` | retry with full sign cue |

## forbidden

- Do not claim the model diagnosed handshape/movement unless validated.
- Do not shame learner.
- Do not imply assessment-grade correctness.
