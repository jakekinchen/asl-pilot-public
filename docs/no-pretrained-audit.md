# no-pretrained audit

**Round-001 task-026 vestige removal note (2026-05-23).**

The pre-round-001 version of this doc described the no-pretrained audit
as deps-only (import-scan over `web/package.json` and source files). It
disclosed the Stage A MediaPipe runtime asset as a tolerated boundary.

After [`task-026`](../MVP_TASKS.md#task-026) removed the Stage A
vestige, the audit is strict — there is no tolerated disclosed
boundary in the promoted lane.

## three-layer audit

The no-pretrained guarantee is asserted by three coordinated audits:

1. **Deps audit** — [`scripts/audit_no_pretrained_deps.mjs`](../scripts/audit_no_pretrained_deps.mjs).
   Scans `web/package.json`, `web/package-lock.json`, `package.json`,
   `package-lock.json`, `pyproject.toml`, `requirements.txt`, and every
   source import under `web/src/` and `scripts/` for banned package
   names (`@mediapipe/*`, `openpose`, `posenet`, `bodypix`, `handpose`,
   `face-api.js`, `ml5`, `coco-ssd`, `mobilenet`, `ultralytics`, `yolo`,
   `@tensorflow-models/*`, `tfjs`, `opencv.js`, `torchvision`, `timm`,
   `transformers`, `keras-cv`, `keras_applications`, `resnet`,
   `efficientnet`, `vision-transformer`, `vit`, `clip`) and banned
   pretrained-loader patterns (`from_pretrained`, `hf_hub_download`,
   `snapshot_download`, `torch.hub.load`, `load_state_dict_from_url`,
   `pretrained=True`, `weights=*PRETRAINED*`, etc.).

2. **Artifact-JSON audit** — [`scripts/audit_no_pretrained_artifact_json.mjs`](../scripts/audit_no_pretrained_artifact_json.mjs).
   Scans the promoted-lane claim chain — `web/public/model/model-card.json`,
   `web/public/model/claim-matrix.json`,
   `docs/validation/final-claim-matrix.json`,
   `docs/validation/supported-label-registry.json`,
   `docs/validation/no-pretrained-lane-audit.json`, and the
   `artifacts/rawframe-model/` tree — for prohibited content:
   - `pretrained_components` must be empty.
   - `extractor.name` must not match `mediapipe_*`, `openpose_*`,
     `posenet_*`, `bodypix_*`, `handpose_*`, `movenet_*`, `blazepose_*`,
     `yolo_*`, or `ultralytics_*`.
   - `extractor.tasks_vision_version`, `extractor.model_asset_sha256`,
     and bare `tasks_vision_version` keys must not appear.
   - Banned narrative substrings (`mediapipe`, `openpose`, `landmarks`,
     `embeddings`, `feature_extractors`, `bounding_boxes`, etc.) trip
     a finding unless the string is explicit negative or
     retrospective-removal language ("no mediapipe", "without landmark
     detector", "vestige removed").
   - `artifacts/stage_a/`, `artifacts/stage_b/`,
     `artifacts/rawframe-model-diagnostics/`, and
     `artifacts/rawframe-model-clip-heldout/` are excluded by design
     (untracked vestige caches and honestly-disclosed historical
     academic-benchmark reports respectively).

3. **Combined receipt** — [`docs/validation/no-pretrained-lane-audit.json`](validation/no-pretrained-lane-audit.json).
   Produced by task-026 §H. Records the SHA-256 of each audit's output
   alongside the removed-vestige summary, and is hash-bound into
   `docs/validation/final-claim-matrix.json`.

## reference

- [`docs/strategy-confidence-audit.md`](strategy-confidence-audit.md) —
  hard gate 1 cites this doc.
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — `#arch-no-pretrained`,
  `#arch-forbidden-shortcuts`.
- [`docs/briefs/001-stage-a-vestige-removal.md`](briefs/001-stage-a-vestige-removal.md) — the task-026 brief.
