# Browser Export Plan

## Export Status

The exporter lives at `tools/detector0-annotator/export_models_web.py`. It imports the existing scratch model definitions instead of reimplementing them:

- `GridDetector` from `train_detector_grid.py`, checkpoint `output/detector0-grid-big2.pt`.
- `HeatmapNet` from `train_hands_landmarks_heatmap.py`, checkpoint `output/detector0-hand-landmarks-merged-w64.pt`.
- `Recognizer` from `train_recognizer.py`, checkpoint `output/recognizer-v4-w64.pt`.

The current torch venv has `onnx` but does not have `onnxruntime`, so export verification is blocked until this exact install runs:

```bash
/Users/kelly/Developer/asl-pilot/.venv/bin/python -m pip install onnx onnxruntime
```

The script intentionally fails closed if either dependency is missing, because the task requires ONNX Runtime CPU parity within `1e-3`. Once dependencies are present, it exports to `tools/detector0-annotator/output/web-onnx/`, checks each ONNX graph, verifies ONNX Runtime CPU output against PyTorch CPU on random inputs, and prints per-model ONNX file sizes plus max/mean absolute diffs. It also writes `manifest.json` next to the exported models.

## Client Runtime

Use `onnxruntime-web` in the browser. Start with WASM for broad compatibility, then enable WebGPU as an acceleration path when the browser exposes it and parity checks pass.

Runtime frame flow:

1. Capture camera frames with `getUserMedia`; keep frames in memory only.
2. Resize the frame to `96x96`, add the two coordconv channels, and run the region `GridDetector`.
3. Pick the `upper_body_or_signing_space` grid cell by highest objectness, decode its normalized crop box, apply the same crop expansion used in `infer_end_to_end.py`, and crop the original camera frame.
4. Resize the signing-space crop to `128x128`, add coordconv channels, and run the hand `HeatmapNet`.
5. Reimplement `soft_argmax` in JavaScript exactly: softmax over each `g*g` heatmap, x/y marginal expectations, divide by `g`, and return crop-normalized 21-point hands.
6. Convert each hand to the recognizer feature vector exactly like `train_recognizer.py`: wrist absolute xy, wrist-relative landmarks divided by mean wrist-relative distance plus `1e-6`, and continuous sigmoid presence probability.
7. Append the frame feature to a rolling sequence buffer, pass `sequence` and `lengths` into the recognizer, and display top-k word probabilities.

This keeps the product lane fully client-side: raw learner video is never uploaded during normal practice, and the browser runtime uses only the project-trained scratch models.

## Guided Practice UX

The first browser milestone should be guided "practice this word" rather than open-ended recognition. The app chooses a target word, shows the prompt and camera preview, runs the client pipeline continuously, and compares the recognizer's top-k distribution against the target over a short stabilized window. The UI should show lightweight feedback such as "align upper body", "keep both hands in frame", "hold the sign a little longer", or "matched target" based on region confidence, hand presence, sequence length, and recognizer confidence.

This limits product risk while the recognizer is still weak: the user is not asked to trust arbitrary 95-way predictions, but the browser path still exercises the full region-to-landmark-to-sequence pipeline.

## Size And Latency

Measured checkpoint sizes and parameter payloads:

| Model | Checkpoint | Params | FP32 payload | Current `.pt` size |
| --- | --- | ---: | ---: | ---: |
| Region `GridDetector` | `detector0-grid-big2.pt` | 245,400 | 0.936 MiB | 969 KiB |
| Landmark `HeatmapNet` | `detector0-hand-landmarks-merged-w64.pt` | 1,298,993 | 4.955 MiB | 5.0 MiB |
| Recognizer `Recognizer` | `recognizer-v4-w64.pt` | 510,559 | 1.948 MiB | 2.0 MiB |

Expected ONNX sizes should be close to the FP32 payloads until quantization is added. The exporter prints actual ONNX file sizes after verified export.

Light CPU sanity timings on this Mac, single-threaded PyTorch CPU, batch 1:

| Step | Input | Time |
| --- | --- | ---: |
| Region | `96x96` frame tensor | 0.65 ms |
| Landmark plus soft-argmax | `128x128` crop tensor | 4.13 ms |
| Recognizer | `T=20`, `feat=90` | 0.81 ms |

Browser WASM will usually be slower than these Python CPU numbers, and WebGPU may be faster after warmup. A practical initial target is to run the region model at camera rate, run the landmark model on a throttled cadence such as 10-15 FPS, and run the recognizer whenever the sequence buffer receives a new landmark frame.

## Parity Risks

The highest-risk parity items are preprocessing and postprocessing, not the raw model weights:

- Coordconv channels must match `train_detector.make_xy`: RGB divided by 255, channel order RGB, shape `NCHW`, x/y ramps from 0 to 1.
- Region decoding must match `gather_cell`: objectness argmax per target, box tensor layout `N, targets, 4, g, g`, normalized `xyxy`.
- Signing-space crop expansion must match `infer_end_to_end.expand_crop`; otherwise the landmark distribution shifts.
- `soft_argmax` must be identical to `train_hands_landmarks_heatmap.soft_argmax`, including softmax over flattened heatmaps and division by `g`.
- Presence must use sigmoid of the landmark presence logits and should stay continuous through the recognizer feature vector.
- Recognizer feature normalization must match `hand_feat`: wrist absolute xy, wrist-relative coordinates, scale as mean Euclidean wrist-relative distance plus `1e-6`, then presence probability.
- The recognizer needs a dynamic time axis in ONNX, but the browser sequence buffer should still start with the trained `T=20` cadence before experimenting with shorter windows.

Before promoting this into the browser app, add a small parity fixture: one saved RGB frame and one saved sequence row that run through PyTorch and browser ONNX, with JSON outputs compared at each boundary.
