# Open-Source Tooling Research

Date: May 20, 2026

## Constraint That Drives The Architecture

The PDF explicitly prohibits pretrained sign classifiers, hand or pose landmark detectors, pretrained feature extractors, and pretrained general-purpose CV backbones. That means common ASL demo stacks based on MediaPipe Hands, OpenPose, YOLO, or a pretrained image/video backbone are not acceptable as the recognition path for this pilot.

## Selected Path

Use a browser-first web application with local camera capture, raw-frame preprocessing, and a small model architecture trained from scratch by the engineering team. Keep model inference in the browser. Store learner account/progress records server-side, but send only attempt metadata, not raw images or video.

## Tool Decisions

| Area | Tool | Decision | Reason |
| --- | --- | --- | --- |
| Web application | Next.js App Router | Use | Browser app, route handlers for pilot auth/progress, client components for camera/inference. |
| Camera capture | `navigator.mediaDevices.getUserMedia` | Use | Native browser camera permission API; MDN documents that it prompts users for camera/media stream permission. |
| In-browser inference | ONNX Runtime Web with WASM execution provider | Use as default browser path | Current code imports `onnxruntime-web/wasm` and pins `executionProviders: ["wasm"]`. WebGPU can be evaluated later as an optimization, not as the default requirement. |
| Training | PyTorch on Apple Silicon MPS | Use for real training loop | PyTorch documents the `mps` backend for Metal GPU acceleration on macOS. |
| Model export | ONNX | Planned | Portable format for browser inference with ONNX Runtime Web. |
| Image/video processing | FFmpeg | Use only for local dataset prep | Useful for raw video decode, resize, crop, RGB formatting, and frame sampling. Do not use pretrained detectors. |
| MediaPipe / hand landmarks | Reject for recognition path | Not allowed | MediaPipe hand landmarks are pretrained landmark detectors, which the PDF explicitly bans. |
| Public ASL datasets | Do not use as production training input unless license review clears the exact use | Cautious | ASL Citizen, WLASL, and ASL-LEX are useful references, but all have non-commercial, research, video-use, or consent/provenance constraints that block production pilot training by default. |
| TensorFlow.js / tensorflow-metal | Do not use for this implementation | Rejected for current path | These packages are not installed locally and the selected browser runtime is ONNX Runtime Web. Keeping them in the plan would add an unnecessary second inference stack. |

## Source Notes

- Refreshed on May 20, 2026 against the official docs below and the retained
  local audit receipt. The selected stack remains unchanged: PyTorch MPS for
  local from-scratch training, ONNX export, and ONNX Runtime Web/WASM for
  browser-default inference.
- MDN documents `getUserMedia()` as the browser API that prompts for permission and returns a media stream from camera/microphone devices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- ONNX Runtime Web documents a WebGPU execution provider designed for browser GPU compute and ML: https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
- ONNX Runtime Web documents WASM as a browser execution provider and separate runtime/session flags: https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html
- ONNX Runtime Web deployment docs cover conditional `onnxruntime-web/wasm` imports and serving matching WASM binaries: https://onnxruntime.ai/docs/tutorials/web/deploy.html
- ONNX Runtime Web deployment docs also require the browser app to serve the
  JavaScript bundle, ONNX Runtime WebAssembly binaries, and model files; this is
  why the project keeps same-origin `/api/ort/` WASM serving in the final
  browser evidence path instead of depending on a CDN.
- PyTorch documents the MPS backend as the macOS Metal GPU path for PyTorch and
  shows moving tensors/modules to the `mps` device: https://docs.pytorch.org/docs/2.12/notes/mps.html
- PyTorch 2.12 documents the `torch.export`-based ONNX exporter and recommends
  `dynamo=True` for the modern export path: https://docs.pytorch.org/docs/2.12/onnx.html
- ONNX documents the Open Neural Network Exchange format as the intermediate
  model format used for production portability checks: https://onnx.ai/onnx/intro/
- Apple documents `tensorflow-metal`, but notes small networks and small batch sizes can be faster on CPU because GPU dispatch overhead can dominate: https://developer.apple.com/metal/tensorflow-plugin/
- Microsoft Research describes ASL Citizen as roughly 84k videos and 2.7k ASL signs, collected with consent under IRB review, with dataset download and license notes: https://www.microsoft.com/en-us/research/project/asl-citizen/
- ASL Citizen's license says the materials may be used solely for non-commercial, non-revenue-generating research, and that data/modifications may not be distributed: https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/
- WLASL provides metadata and scripts for word-level ASL videos, but its README notes original videos must be downloaded and some videos can disappear: https://github.com/dxli94/WLASL
- WLASL's README says the data is for academic/computational use only and no commercial usage is allowed: https://github.com/dxli94/WLASL
- WLASL's README also references YOLOv3-derived bounding boxes and pretrained I3D/TGCN baselines, so none of its boxes, pose data, or pretrained baseline artifacts may enter this no-pretrained pipeline: https://raw.githubusercontent.com/dxli94/WLASL/master/README.md
- ASL-LEX licenses the database/visualization under CC BY-NC 4.0, but excludes sign reference videos; the reference videos may not be saved, displayed, or otherwise used without explicit permission: https://asl-lex.org/download.html
- The machine-readable source decisions and the current public-source evidence are recorded in `docs/model/dataset-source-register.json` and `docs/research/dataset-source-evidence.md`; `node scripts/audit_source_register.mjs` enforces those decisions before final manifests or training can use them.

## Practical Plan

1. Build the browser pilot with no raw-video upload and a clean model boundary.
2. Include the 75-100 item ASL 1 vocabulary list in source control.
3. Complete qualified ASL vocabulary review before allowing collection capture from the plan.
4. Implement dataset capture/curation scripts that produce signer-disjoint train/validation/test manifests, with consent and license provenance for every clip.
5. Train a small raw-frame baseline from scratch on Apple Silicon MPS.
6. Export a versioned model artifact for browser inference through ONNX Runtime Web/WASM.
7. Validate secure-origin camera behavior, ONNX WASM asset serving, model warm/load, browser latency, controlled camera/lighting/framing assumptions, and optional WebGPU only after the WASM path is correct.

## Current Local Environment

- Run `./.venv/bin/python scripts/audit_local_ml_environment.py --write-report docs/validation/local-ml-environment.json --report docs/validation/local-ml-environment.json` before the real decode/train/evaluation/export phase.
- The current project venv has `torch==2.12.0` installed.
- PyTorch reports MPS built and available on this device, and the retained
  receipt includes a successful tensor allocation/computation on `mps:0`.
- The project venv has `onnx==1.21.0` and `onnxscript==0.7.0` installed for PyTorch-to-ONNX export validation.
- The web app has `onnxruntime-web==1.26.0` installed for browser-local ONNX inference with WASM execution.
- Python `onnxruntime` is not installed and is not required for the selected path because browser inference uses `onnxruntime-web/wasm`.
- FFmpeg 8.0.1 is installed locally and is used only for raw video decode, resize, crop, RGB formatting, and frame sampling before tensor serialization.
- The retained local ML receipt must record sanitized Apple Silicon CPU/memory/GPU resource evidence and project-volume storage headroom. Final collection/training requires at least 40 GiB free and warns below the 100 GiB recommended pre-collection threshold.
- Current retained-resource evidence is strong for compute and barely above the
  storage hard floor: Apple M3 Ultra, 28 logical CPU cores, 60 Apple GPU cores,
  96 GiB memory, and roughly 42 GiB available on the project volume. That passes
  the 40 GiB hard minimum but remains below the recommended 100 GiB
  pre-collection headroom, so large real collection runs should clean up or move
  non-project data first.
- No retained `.pt`, `.onnx`, or synthetic smoke provenance artifacts are present in the current checkout. Any wiring claim for decode/train/evaluate/export should be refreshed by rerunning the smoke commands and retaining or documenting the resulting evidence.

## Browser Deployment Checks

- Final camera practice must run from `https://` or `localhost` because `getUserMedia()` is secure-context gated.
- The production bundle must serve the ONNX model card, `.onnx` artifact, and matching ONNX Runtime Web WASM binaries.
- The final validation pass should warm/load the ONNX session, submit representative frame tensors, record browser latency, and keep WASM as the default execution provider.
- `ort.env.wasm.proxy` or WebGPU should be considered only if measured UI blocking or latency justifies it.

## Rejected Shortcut

The research subagent found the common "MediaPipe landmarks plus classifier" route. That route is good for many demos, but it violates Requirement 7 because MediaPipe Hands is a pretrained hand landmark detector. It can be referenced in docs as a comparison, but it cannot be used in the submitted recognition system.

## Confidence Position

I am confident that the compliant technical strategy is:

- first-party or explicitly cleared training data only
- no pretrained detector, feature extractor, classifier, or backbone
- raw-frame preprocessing only
- from-scratch model architecture and random initialization
- browser-default inference
- server persistence for account/progress metadata only
- fail-closed thresholds calibrated from signer-disjoint validation

I am not confident that the project is complete until the implementation, dataset, trained model, and validation evidence exist.
