# ASL Pilot Web App

Browser UI for the ASL 1 vocabulary practice pilot.

## Run

```bash
npm run dev -- --hostname 127.0.0.1 --port 3025
```

Open `http://127.0.0.1:3025`.

## Verify

```bash
npm run lint
npm run build
```

## Notes

- Camera frames are sampled locally in the browser.
- `/api/attempts` accepts metadata only and rejects raw frame/image/video-like payloads.
- The current model card is `not_trained`, so the practice flow fails closed until a from-scratch trained ONNX artifact, calibrated model card, and signer-disjoint validation report exist.
- The browser runner uses `onnxruntime-web` only after a trained model card points to a hash-pinned ONNX artifact in `web/public/model/`.
- Account/progress persistence uses a local JSON store for the pilot prototype.
- Dataset clip collection is disabled by default. For explicit-consent collection sessions only, run with `ENABLE_DATASET_COLLECTION=true` and `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true`.
