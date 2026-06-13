# Model Card Template

Every submitted model version must include this information.

```json
{
  "model_id": "asl-pilot-rawframe-v0",
  "status": "not_trained",
  "vocabulary_count": 0,
  "vocabulary_hash": null,
  "architecture": {
    "family": "raw_frame_compact_3d_cnn",
    "summary": "compact_3d_cnn_spatiotemporal",
    "pretrained_components": []
  },
  "initialization": "random",
  "training_data_manifest": null,
  "validation_data_manifest": null,
  "test_data_manifest": null,
  "training_framework": null,
  "training_device": null,
  "random_seed": null,
  "export_format": "onnx",
  "browser_artifact": {
    "path": null,
    "sha256": null
  },
  "model": {
    "frame_count": null,
    "image_size": null,
    "input_name": "clips",
    "output_name": "logits",
    "label_to_index": {}
  },
  "onnx_export_provenance": {
    "path": null,
    "sha256": null
  },
  "training_provenance": {
    "path": null,
    "sha256": null,
    "note": "For final trained cards, point this at calibrated-provenance.json, not uncalibrated training-provenance.json."
  },
  "confidence_thresholds": {
    "default": null,
    "policy": "fail_closed",
    "source": "validation_calibration_required"
  },
  "validation": {
    "signer_disjoint": false,
    "report_path": null,
    "report_sha256": null
  },
  "metrics": {
    "top1_accuracy": null,
    "macro_f1": null,
    "false_pass_rate": null
  },
  "prohibited_dependencies_audit": {
    "passed": false,
    "scope": [
      "package manifests",
      "lockfiles",
      "training imports",
      "training scripts",
      "downloaded files",
      "model artifacts",
      "export logs",
      "model card hashes"
    ],
    "checked_for": [
      "mediapipe",
      "openpose",
      "yolo",
      "pretrained_sign_classifier",
      "pretrained_landmark_detector",
      "pretrained_feature_extractor",
      "pretrained_backbone"
    ]
  },
  "artifact_hashes": {
    "training_script": null,
    "model_weights": null,
    "browser_export": null
  },
  "known_limitations": []
}
```
