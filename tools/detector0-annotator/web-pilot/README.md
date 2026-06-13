# ASL Guided Practice Web Pilot

Client-side scaffold for the Detector 0 guided-practice path:

`webcam -> 96px region ONNX -> signing-space crop -> 128px landmark ONNX -> JS soft-argmax -> 90-D frame features -> recognizer ONNX -> target accept/reject`

The page does not upload learner video. Frames stay in the browser; network requests are limited to `onnxruntime-web` from the CDN and the local ONNX files.

## Run

Recommended, with the default `../output/onnx/` model path:

```sh
cd tools/detector0-annotator
python -m http.server 8000
```

Open:

```text
http://localhost:8000/web-pilot/
```

The default model path is `../output/onnx/` relative to `web-pilot/index.html`, so the page loads:

- `../output/onnx/detector0-grid-big2.onnx`
- `../output/onnx/detector0-hand-landmarks-merged-w64.onnx`
- `../output/onnx/recognizer-v4-w64.onnx`

Serving from inside `web-pilot/` is also fine:

```sh
cd tools/detector0-annotator/web-pilot
python -m http.server 8000
```

Most static servers started there will not expose the sibling `../output/onnx/` directory. In that case, copy the three ONNX files into a served directory and change the page's model path field, for example `./onnx/`.

## Notes

- This scaffold uses the current v4 recognizer weights and the v4 95-word label list.
- The orchestrator can swap in v5 weights by replacing the ONNX files and updating `LABELS` in `pipeline.js` if the class list changes.
- `tau` defaults to `0.00043`, the recall-at-FAR10 threshold from `research/target-verification-metric.md`.
- Presence gating defaults to `0.5`; accepted hands use wrist absolute xy, wrist-relative landmarks divided by mean distance to wrist, and the continuous presence probability, matching `train_recognizer.py hand_feat`.
