# Browser Pilot JS/Python Parity Report

Date: 2026-05-31

Scope: fixed-frame parity for `tools/detector0-annotator/web-pilot/pipeline.js` against the Python preprocessing/postprocessing path, using the same exported ONNX models on CPU:

- `output/onnx/detector0-grid-big2.onnx`
- `output/onnx/detector0-hand-landmarks-merged-w64.onnx`
- `output/onnx/recognizer-v4-w64.onnx`

No training, MPS, GPU, checkpoint writes, or git operations were run.

## Harness

Artifacts:

- `tools/detector0-annotator/web-pilot/test/frames/`: 5 fixed RGB PNG frames copied from `.cache-eval/frames/`
- `tools/detector0-annotator/web-pilot/test/frames_manifest.json`
- `tools/detector0-annotator/web-pilot/test/ref_python.json`
- `tools/detector0-annotator/web-pilot/test/out_js.json`
- `tools/detector0-annotator/web-pilot/test/out_js_bilinear.json`
- `tools/detector0-annotator/web-pilot/test/parity_summary.json`

Commands run:

```sh
cd tools/detector0-annotator/web-pilot/test
npm install
PYTHONDONTWRITEBYTECODE=1 /Users/kelly/Developer/asl-pilot/.venv/bin/python prepare_frames.py
PYTHONDONTWRITEBYTECODE=1 /Users/kelly/Developer/asl-pilot/.venv/bin/python make_ref_python.py
node run_js_port.js --out out_js.json
node run_js_port.js --resize bilinear --out out_js_bilinear.json
PYTHONDONTWRITEBYTECODE=1 /Users/kelly/Developer/asl-pilot/.venv/bin/python compare_parity.py --extra-js out_js_bilinear.json
```

`npm install` was used only to fetch `onnxruntime-node` for the Node CPU harness; `package-lock.json` records the dependency.

Python reference path:

- Region input: fixed `.cache-eval/frames96.npy` for the selected cache frames.
- Crop input: OpenCV `INTER_AREA` after the Python signing-space crop math.
- Postprocess: Python-equivalent region decode, soft-argmax over landmark heatmaps, `train_recognizer.py` wrist-relative `hand_feat`, then recognizer over a repeated 16-frame sequence.

JS path:

- `onnxruntime-node` CPU execution.
- Imports `pipeline.js` core functions for region decode, crop expansion, soft-argmax, feature vector construction, labels, and area resize.
- Primary `out_js.json` uses the fixed area-resize path now wired into `pipeline.js`.

## Results

Primary fixed JS path (`resize_mode=area`):

| metric | max abs diff |
|---|---:|
| signing-space box | 0.000379 |
| expanded crop box | 0.000512 |
| hand landmarks | 0.002662 |
| 90-D feature vector | 0.055394 |
| recognizer 95-prob vector | 0.057603 |

Top-k agreement:

| agreement | result |
|---|---:|
| top-1 | 5/5 |
| top-5 set | 5/5 |
| top-5 ordered | 5/5 |

Per-frame primary parity:

| frame label | Python top-1 | JS top-1 | landmark max diff | feature max diff | prob max diff |
|---|---|---|---:|---:|---:|
| TV | think | think | 0.002662 | 0.034315 | 0.017923 |
| after | please | please | 0.001471 | 0.055394 | 0.057603 |
| airplane | airplane | airplane | 0.000000 | 0.000001 | 0.000001 |
| all | girl | girl | 0.000000 | 0.000005 | 0.000004 |
| animal | thankyou | thankyou | 0.000000 | 0.000001 | 0.000001 |

The predicted words above are parity outputs, not accuracy claims against the fixed-frame labels.

## Divergence Source

The largest port risk was resize interpolation. With the old bilinear/canvas-like harness path, diffs and top-k agreement were much worse:

| metric | bilinear max abs diff |
|---|---:|
| signing-space box | 0.005945 |
| expanded crop box | 0.008026 |
| hand landmarks | 0.075169 |
| 90-D feature vector | 0.794370 |
| recognizer 95-prob vector | 0.590283 |

Top-k agreement for the bilinear path:

| agreement | result |
|---|---:|
| top-1 | 3/5 |
| top-5 set | 2/5 |
| top-5 ordered | 0/5 |

Conclusion: resize interpolation dominated the JS/Python divergence. Matching Python's area resize for the 96px region input and 128px signing-space crop moved top-1/top-5 agreement to 5/5 on this fixed slice.

## Pipeline Fixes Applied

`tools/detector0-annotator/web-pilot/pipeline.js` was minimally refactored to:

- Export core pure functions for Node parity testing while preserving browser startup behavior.
- Use an area-resize RGBA preprocessing path for both region and crop model inputs instead of browser `drawImage` smoothing.
- Match `train_recognizer.py hand_feat` by keeping predicted landmarks plus continuous presence whenever landmark coordinates exist, instead of zeroing a hand feature vector at the overlay presence threshold.

## Verdict

For these 5 fixed frames, the fixed browser pipeline is faithful enough for the target-verification UX behavior expected from the Python path: recognizer top-1 and full ordered top-5 match on every frame, and the remaining probability max diff is 0.057603.

Remaining risk:

- This is a fixed-frame CPU harness, not an in-browser camera capture test.
- The JS area resize is close to, but not bit-exact with, OpenCV `INTER_AREA`; the largest residual feature diff is 0.055394.
- The recognizer was tested on repeated 16-frame single-frame sequences, so temporal multi-frame camera jitter remains outside this parity slice.
