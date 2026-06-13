# Browser Runtime Contract

## purpose

Allow product and model teams to work in parallel. The UI depends on this contract, not direct model internals.

## files

- `web/public/model/guided_crop_signnet.onnx`
- `web/public/model/model-manifest.json`
- `src/inference/InferenceEngine.ts`
- `src/evaluation/passFail.ts`

## manifest shape

```json
{
  "modelVersion": "guided_crop_signnet_v1",
  "runtime": "onnxruntime-web",
  "artifact": "/model/guided_crop_signnet.onnx",
  "activeLabels": ["book", "car"],
  "input": {
    "frames": 16,
    "crops": ["upper_body", "hand_a", "hand_b", "union"]
  },
  "thresholdsPath": "/model/thresholds.json",
  "createdAt": "2026-05-23",
  "claimTier": "active_10sign_controlled_pilot"
}
```

## pass/fail boundary

The browser inference engine returns probabilities/quality. The evaluator decides pass/fail. UI consumes only evaluator output.

## fallback behavior

- If model fails to load: practice may use content-only mode, but cannot claim recognition.
- If prompt gloss not active: do not call recognizer for pass/fail.
- If confidence is uncertain: fail/abstain and show retry hint.
