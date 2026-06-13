# Final Provenance Audit Gate

This is the gate that must pass before claiming the model satisfies the PDF's no-pretrained requirement.

## Required Inputs

- package manifests and lockfiles
- Python environment manifest
- training source code
- preprocessing source code
- decoded tensor generation logs
- dataset source register
- machine-readable source register JSON and hash
- consent form path/version/hash carried through manifests and model artifacts
- train/validation/test manifests
- negative challenge manifest with reject-only clips and decoded tensors
- decoded tensor files and hashes
- consent records
- final vocabulary review evidence
- clip-level ASL label review evidence
- negative challenge review evidence
- final external attestation evidence
- final static/live HTTP privacy smoke evidence
- final browser ONNX runtime smoke evidence
- downloaded file list with URLs and checksums
- model-card JSON
- model export logs
- exported browser model artifact
- validation report JSON with calibrated threshold evidence
- negative challenge false-pass evidence at the calibrated threshold
- calibrated provenance JSON binding the checkpoint, manifest hashes, validation report hash, and threshold policy
- ONNX export provenance with source checkpoint hash, training provenance hash, input/output names, input shape, label mapping, opset, export command, export script hash, and environment lockfile hashes
- browser ONNX smoke evidence proving the final `.onnx` artifact loads in browser through `onnxruntime-web` WASM and returns logits matching the model-card label count
- `scripts/run_final_browser_onnx_smoke.mjs` output written against the current local app URL
- final browser compatibility observations and `scripts/run_final_browser_compatibility.mjs` output binding those observations, schema-bound network logs, command/signed-review receipts, model card, ONNX smoke report, and browser artifact hashes
- `scripts/audit_model_artifacts.mjs` output
- `scripts/audit_source_register.mjs` output
- `scripts/audit_clip_review.mjs` output
- `scripts/audit_challenge_review.mjs` output
- `scripts/audit_completion_readiness.mjs` output
- `scripts/promote_trained_model_card.mjs --dry-run` output
- `scripts/audit_external_attestations.mjs` output

## Fail Conditions

- Any pretrained model, weights, checkpoint, backbone, detector, landmark extractor, feature extractor, or ASL classifier is used in training, preprocessing, validation, or browser inference.
- Any generated landmarks, pose files, bounding boxes, embeddings, or features come from a pretrained detector/extractor.
- Any framework call sets `pretrained=True`, passes non-null pretrained `weights`, loads a non-project checkpoint, or imports a model zoo architecture with pretrained weights.
- Any production training clip lacks consent/license clearance for model training and pilot use.
- Any manifest, validation report, calibrated provenance, ONNX export provenance, or trained model card lacks the current `docs/privacy/dataset-consent-form.md` hash and consent version.
- Any vocabulary item remains unreviewed by a qualified ASL instructor or Deaf educator, or final review evidence does not hash-match the current vocabulary source.
- Any production training clip remains unreviewed or lacks approved clip-level ASL label review metadata.
- Any captured clip is neither approved nor explicitly rejected with a reviewer reason before export.
- Any exported negative challenge clip lacks approved challenge review metadata.
- Any manifest is not bound to `docs/model/dataset-source-register.json` by path and SHA-256 hash.
- Any manifest source decision differs from the machine-readable source register.
- Any final train/validation/test manifest has fewer than five approved clips for any reviewed label.
- Any final human fact is only implied by schema-shaped local data instead of attested in `docs/review/final-external-attestations.json` with hash-pinned evidence files.
- Any model artifact lacks hashes tying it back to the training script, dataset manifests, validation report, source checkpoint, and export command.
- Any final training, validation, or export evidence lacks the exact command array, script hash, and `requirements.txt` / `web/package-lock.json` hashes.
- Any `trained` model card lacks an ONNX browser artifact hash, training provenance hash, calibrated threshold, signer-disjoint validation report hash, or required metric thresholds.
- Any `trained` model card lacks the browser input metadata and dense `label_to_index` mapping needed to interpret ONNX logits.
- Any final ONNX artifact lacks retained browser runtime evidence from `docs/validation/final-browser-onnx-smoke.json`.
- Any trained model card was hand-edited instead of generated from final validation and ONNX export provenance through `scripts/promote_trained_model_card.mjs`.
- Any validation report was generated with `--allow-smoke-eval`, contains `status: "smoke_only"`, has a non-positive threshold, or does not match the final checkpoint/provenance/manifest hashes.
- Any final validation report omits `data/manifests/negative-challenge.json`, lacks empty-camera/no-hands/low-light/off-center challenge coverage, or reports a negative challenge false-pass rate of 0.05 or higher.

## Pass Evidence

- Full audit log.
- Model card with artifact hashes.
- Dataset source register with consent/license decisions.
- `node scripts/audit_source_register.mjs` passes.
- Final vocabulary review evidence from `docs/review/final-vocabulary-review.json`.
- Clip-level label review evidence carried into every final manifest.
- `node scripts/audit_clip_review.mjs` passes against the final collection store.
- Negative challenge review evidence carried into `data/manifests/negative-challenge.json`.
- `node scripts/audit_challenge_review.mjs` passes against the final collection store.
- Final static/live HTTP privacy smoke evidence from `docs/privacy/final-privacy-smoke.json`.
- `node scripts/audit_final_privacy_smoke.mjs` passes.
- Final browser ONNX runtime evidence from `docs/validation/final-browser-onnx-smoke.json`.
- `node scripts/run_final_browser_onnx_smoke.mjs --app-url http://127.0.0.1:3025 --write` completes successfully.
- `node scripts/audit_final_browser_onnx_smoke.mjs` passes.
- `node scripts/run_final_browser_compatibility.mjs --app-url http://127.0.0.1:3025 --observations docs/validation/final-browser-compatibility.observations.json --output docs/validation/final-browser-compatibility.json --write --write-on-pass-only` completes after Chrome, Edge, Safari, and Firefox observations are recorded.
- `node scripts/audit_final_browser_compatibility.mjs` passes.
- Final external attestation evidence from `docs/review/final-external-attestations.json` with current SHA-256 hashes for each evidence file.
- Training log showing random initialization and project-owned training.
- Validation report over signer-disjoint held-out data and signer-disjoint negative challenge clips, plus calibrated provenance consumed by the ONNX export.
- `node scripts/promote_trained_model_card.mjs --dry-run` passes before writing the final model card.
- `node scripts/audit_external_attestations.mjs` passes.
- `node scripts/audit_model_artifacts.mjs --require-trained` passes with the final trained model card.
- `node scripts/audit_completion_readiness.mjs` passes with no partial or failed checks.
