# Browser Compatibility Matrix

## Scope

This matrix covers the controlled pilot target: a modern desktop browser on a computer with camera access. It does not claim classroom-scale device coverage or mobile reliability.

## Required Behaviors

| Scenario | Required Behavior | Current Evidence | Status |
| --- | --- | --- | --- |
| Camera API available | Learner can start camera from the practice screen. | `web/src/components/PracticeApp.tsx` calls `navigator.mediaDevices.getUserMedia()` only after a user action. | Implemented |
| Secure origin | Final deployment uses HTTPS or localhost so browser camera APIs are available. | Research doc records the secure-context requirement for `getUserMedia()`. | Required final deployment check |
| Camera denied | Learner sees a plain permission message and can retry after changing browser settings. | `PracticeApp.tsx` handles `NotAllowedError` and `PermissionDeniedError`. | Static gate |
| Camera missing | Learner sees a plain no-camera message. | `PracticeApp.tsx` handles `NotFoundError` and `DevicesNotFoundError`. | Static gate |
| Camera unsupported | Learner sees a plain unsupported-browser message. | `PracticeApp.tsx` checks for missing `navigator.mediaDevices?.getUserMedia`. | Static gate |
| Generic camera error | Learner sees a plain setup error, not a stack trace. | `PracticeApp.tsx` maps other camera failures to a generic message. | Static gate |
| WASM inference | Browser recognition uses an execution path that does not require WebGPU. | `web/src/lib/client-model.ts` hash-checks the browser ONNX artifact against the trained model card, then uses `onnxruntime-web/wasm` with the WASM provider and same-origin `/api/ort/` WASM route. | Implemented scaffold |
| App client ONNX wiring | The app's own client-model path can load a browser ONNX artifact and return logits through ONNX Runtime Web. | `scripts/run_browser_onnx_wiring_smoke.mjs` writes `docs/validation/browser-onnx-wiring-smoke.json` with a smoke-only two-label fixture; final evidence must use `/smoke/browser-onnx?mode=final` and the same `web/src/lib/client-model.ts` path. | Smoke-only proof; final gate pending |
| Optional WebGPU | WebGPU may be evaluated later, but is not required for the pilot default. | Not used in current code. | Not required |
| Raw frame privacy | Normal practice does not upload raw frames/images/video/blob payloads. | `scripts/audit_no_raw_video_upload.mjs` passes; `docs/validation/practice-progress-smoke.json` proves the live attempt route rejects a raw frame payload without saving progress. | Static and runtime gates |
| Dataset collection separation | Raw clip recording/upload exists only in explicit collection sessions after vocabulary review. | Dataset UI/API require both `ENABLE_DATASET_COLLECTION=true` and `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true`; draft pre-review plans are refused. | Implemented scaffold |
| Latency | Report warmup and per-attempt timing after the real ONNX artifact exists. | No trained ASL ONNX artifact exists yet. | Missing final evidence |

## Browser Matrix

| Browser | Minimum Expected Path | Current Project Evidence | Remaining Final Evidence |
| --- | --- | --- | --- |
| Chrome desktop | Camera API, local frame sampling, WASM inference, metadata-only save. | App code and audits cover the expected path. | Real trained artifact warmup/per-attempt latency test. |
| Edge desktop | Same Chromium path as Chrome. | App code and audits cover the expected path. | Real trained artifact warmup/per-attempt latency test. |
| Safari desktop | Camera API and WASM inference without requiring WebGPU. | App uses standard `getUserMedia()` and ONNX Runtime Web WASM path. | Live Safari smoke after final artifact exists. |
| Firefox desktop | Camera API and WASM inference without requiring WebGPU. | App uses standard `getUserMedia()` and ONNX Runtime Web WASM path. | Live Firefox smoke after final artifact exists. |

## Audit Command

Run the static compatibility gate with:

```sh
node scripts/audit_browser_compatibility.mjs
```

This gate proves the required code paths and documentation are present. It does not replace final browser/device testing with the real trained model artifact.

Run the smoke-only app client ONNX wiring proof with:

```sh
node scripts/run_browser_onnx_wiring_smoke.mjs --write
node scripts/audit_browser_onnx_wiring_smoke.mjs
```

That report exercises the app's hidden smoke route and real client-model
inference path with a deterministic two-label fixture. It is explicitly
`smoke_only` and does not replace final browser evidence for the trained ASL
artifact.

After the final trained ONNX artifact and browser ONNX smoke evidence exist,
record Chrome, Edge, Safari, and Firefox observations from
`docs/validation/final-browser-compatibility.observations.template.json`, then
build and audit the retained final cross-browser evidence:

```sh
node scripts/run_final_browser_compatibility.mjs --app-url http://127.0.0.1:3025 --write
node scripts/audit_final_browser_compatibility.mjs
```

That final audit fails until Chrome, Edge, Safari, and Firefox desktop rows all
show secure-origin camera access, WASM inference, latency numbers, final model
artifact loading, no normal-practice raw-media upload observations, exact
operator command/workflow notes, and hash-pinned retained evidence files. Each
browser row must include at least screenshot-or-trace evidence plus HAR or
network-log evidence, with SHA-256 hashes checked by the runner and audit. The
network log must include a hash-matched browser ONNX artifact fetch and at least
one same-origin `/api/ort/*.wasm` fetch whose digest matches the local
`onnxruntime-web` asset. Automated rows must bind the Playwright command to the
declared browser, and each row's browser/engine fields must match the declared
Chrome, Edge, Safari, or Firefox target.
Manual `manual_signed_review` rows must also include a machine-readable signed
review receipt with Ed25519 `signature_evidence` over the canonical review
payload; a textual approval or unsigned JSON receipt is not final evidence.
The final compatibility `app_url` must be the real practice app root `/`, such
as `http://127.0.0.1:3025`, not an alternate route, query, hash, or the hidden
`/smoke/browser-onnx` route reserved for final browser ONNX smoke evidence.
