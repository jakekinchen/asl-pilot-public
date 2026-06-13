#!/usr/bin/env python3
"""Extract project-owned raw-tensor helper features for the canonical verifier."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import torch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SUMMARY = PROJECT_ROOT / "docs" / "validation" / "canonical-verifier-helper-features.json"
DEFAULT_FEATURES = PROJECT_ROOT / "artifacts" / "rawframe-model-diagnostics" / "canonical-verifier-010" / "helper-features.json"
DEFAULT_MANIFESTS = {
    "templates": PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "templates.json",
    "calibration": PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "calibration.json",
    "test": PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "test.json",
    "hard_negative_calibration": PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "hard_negative_calibration.json",
    "hard_negative_test": PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "hard_negative_test.json",
    "core_negative_challenge": PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "core_negative_challenge.json",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--output-summary", type=Path, default=DEFAULT_SUMMARY)
    parser.add_argument("--output-features", type=Path, default=DEFAULT_FEATURES)
    return parser.parse_args()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(value, indent=2, sort_keys=True)}\n", encoding="utf-8")


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, Any]:
    return {
        "path": project_relative(path),
        "exists": path.exists(),
        "sha256": sha256_file(path) if path.exists() else None,
    }


def resolve_manifest_path(manifest_path: Path, relative_path: str) -> Path:
    return (manifest_path.parent / relative_path).resolve()


def load_clip_tensor(tensor_path: Path) -> torch.Tensor:
    frames = torch.load(tensor_path, map_location="cpu", weights_only=True)
    if isinstance(frames, dict) and isinstance(frames.get("rgb_frames"), torch.Tensor):
        frames = frames["rgb_frames"]
    if not isinstance(frames, torch.Tensor):
        raise TypeError(f"{project_relative(tensor_path)} did not contain a tensor")
    if frames.ndim != 4 or frames.shape[-1] != 3:
        raise ValueError(f"{project_relative(tensor_path)} expected tensor shape T,H,W,3; found {tuple(frames.shape)}")
    return frames.to(dtype=torch.float32) / 255.0


def weighted_quantile_bbox(weights: torch.Tensor, threshold_fraction: float = 0.15) -> tuple[float, float, float, float, float]:
    height, width = weights.shape
    max_value = float(weights.max().item()) if weights.numel() else 0.0
    if max_value <= 1e-8:
        return 0.5, 0.5, 0.0, 0.0, 0.0
    mask = weights >= (max_value * threshold_fraction)
    if int(mask.sum().item()) == 0:
        return 0.5, 0.5, 0.0, 0.0, max_value
    ys, xs = torch.where(mask)
    total = weights[mask].sum().clamp_min(1e-8)
    cx = float((xs.to(torch.float32) * weights[mask]).sum().item() / total.item()) / max(width - 1, 1)
    cy = float((ys.to(torch.float32) * weights[mask]).sum().item() / total.item()) / max(height - 1, 1)
    bbox_w = float((xs.max() - xs.min() + 1).item()) / width
    bbox_h = float((ys.max() - ys.min() + 1).item()) / height
    return cx, cy, bbox_w, bbox_h, max_value


def extract_features(frames: torch.Tensor) -> dict[str, Any]:
    gray = frames.mean(dim=3)
    brightness_mean = float(gray.mean().item())
    brightness_std = float(gray.std(unbiased=False).item())
    if gray.shape[0] < 2:
        motion = torch.zeros_like(gray)
    else:
        diffs = torch.abs(gray[1:] - gray[:-1])
        motion = torch.cat([diffs[:1], diffs], dim=0)
    frame_energy = motion.mean(dim=(1, 2))
    energy_mean = float(frame_energy.mean().item())
    energy_max = float(frame_energy.max().item())
    active_threshold = max(energy_mean * 0.75, 0.01)
    active_frame_ratio = float((frame_energy >= active_threshold).to(torch.float32).mean().item())
    centroids = []
    bbox_areas = []
    bbox_widths = []
    bbox_heights = []
    motion_peaks = []
    for frame_motion in motion:
        cx, cy, bbox_w, bbox_h, max_value = weighted_quantile_bbox(frame_motion)
        centroids.append((cx, cy))
        bbox_areas.append(bbox_w * bbox_h)
        bbox_widths.append(bbox_w)
        bbox_heights.append(bbox_h)
        motion_peaks.append(max_value)
    velocities = [
        ((centroids[index][0] - centroids[index - 1][0]) ** 2 + (centroids[index][1] - centroids[index - 1][1]) ** 2) ** 0.5
        for index in range(1, len(centroids))
    ]
    frame_sequence = []
    for index, (cx, cy) in enumerate(centroids):
        frame_gray = gray[index]
        frame_sequence.append({
            "frame_index": index,
            "brightness_mean": float(frame_gray.mean().item()),
            "brightness_std": float(frame_gray.std(unbiased=False).item()),
            "motion_energy": float(frame_energy[index].item()),
            "motion_peak": motion_peaks[index],
            "motion_centroid_x": cx,
            "motion_centroid_y": cy,
            "motion_bbox_width": bbox_widths[index],
            "motion_bbox_height": bbox_heights[index],
            "motion_bbox_area": bbox_areas[index],
            "motion_velocity_from_previous": velocities[index - 1] if index > 0 else 0.0,
        })
    centroid_x_values = [point[0] for point in centroids]
    centroid_y_values = [point[1] for point in centroids]
    quality_gate = {
        "usable_motion_energy": energy_mean >= 0.01,
        "usable_brightness": 0.08 <= brightness_mean <= 0.92,
        "nontrivial_active_frames": active_frame_ratio >= 0.25,
    }
    return {
        "frame_count": int(frames.shape[0]),
        "height": int(frames.shape[1]),
        "width": int(frames.shape[2]),
        "brightness_mean": brightness_mean,
        "brightness_std": brightness_std,
        "motion_energy_mean": energy_mean,
        "motion_energy_max": energy_max,
        "active_frame_ratio": active_frame_ratio,
        "motion_centroid_mean_x": sum(centroid_x_values) / len(centroid_x_values),
        "motion_centroid_mean_y": sum(centroid_y_values) / len(centroid_y_values),
        "motion_centroid_range_x": max(centroid_x_values) - min(centroid_x_values),
        "motion_centroid_range_y": max(centroid_y_values) - min(centroid_y_values),
        "motion_velocity_mean": sum(velocities) / len(velocities) if velocities else 0.0,
        "motion_velocity_max": max(velocities) if velocities else 0.0,
        "motion_bbox_area_mean": sum(bbox_areas) / len(bbox_areas),
        "motion_bbox_area_max": max(bbox_areas),
        "frame_sequence_feature_names": [
            "brightness_mean",
            "brightness_std",
            "motion_energy",
            "motion_peak",
            "motion_centroid_x",
            "motion_centroid_y",
            "motion_bbox_width",
            "motion_bbox_height",
            "motion_bbox_area",
            "motion_velocity_from_previous",
        ],
        "frame_sequence": frame_sequence,
        "quality_gate": quality_gate,
        "quality_gate_passed": all(quality_gate.values()),
    }


def process_manifest(split: str, manifest_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    manifest = read_json(manifest_path)
    records = []
    missing_tensor_count = 0
    quality_pass_count = 0
    for clip in manifest.get("clips", []):
        relative_tensor = clip.get("relative_frame_tensor_path")
        if not relative_tensor:
            missing_tensor_count += 1
            continue
        tensor_path = resolve_manifest_path(manifest_path, relative_tensor)
        features = extract_features(load_clip_tensor(tensor_path))
        quality_pass_count += 1 if features["quality_gate_passed"] else 0
        records.append({
            "split": split,
            "clip_id": clip.get("clip_id"),
            "label_id": clip.get("label_id"),
            "source_id": clip.get("source_id"),
            "canonical_verifier_role": clip.get("canonical_verifier_role"),
            "tensor": file_reference(tensor_path),
            "features": features,
        })
    summary = {
        "manifest": file_reference(manifest_path),
        "clip_count": len(manifest.get("clips", [])),
        "feature_record_count": len(records),
        "missing_tensor_count": missing_tensor_count,
        "quality_gate_pass_count": quality_pass_count,
        "quality_gate_pass_rate": quality_pass_count / len(records) if records else 0.0,
    }
    return records, summary


def build() -> tuple[dict[str, Any], dict[str, Any]]:
    split_records = {}
    split_summaries = {}
    for split, manifest_path in DEFAULT_MANIFESTS.items():
        records, summary = process_manifest(split, manifest_path)
        split_records[split] = records
        split_summaries[split] = summary
    feature_count = sum(len(records) for records in split_records.values())
    summary = {
        "schema_version": "asl-pilot-canonical-verifier-helper-features/v1",
        "status": "written",
        "finality": "helper_feature_diagnostic_not_model_evidence",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": file_reference(Path(__file__).resolve()),
            "command": None,
        },
        "helper_boundary": {
            "feature_source": "decoded raw RGB tensors",
            "pretrained_components": [],
            "landmark_components": [],
            "detector_components": [],
            "sign_classifier_components": [],
            "official_decision_model": "not_implemented",
            "allowed_role": "preprocessing_quality_gate_or_candidate_project_owned_feature_input",
        },
        "feature_set": [
            "brightness_mean",
            "brightness_std",
            "motion_energy_mean",
            "active_frame_ratio",
            "motion_centroid_mean_x",
            "motion_centroid_mean_y",
            "motion_centroid_range_x",
            "motion_centroid_range_y",
            "motion_velocity_mean",
            "motion_bbox_area_mean",
            "frame_sequence",
        ],
        "features": {
            "path": project_relative(DEFAULT_FEATURES),
            "exists": DEFAULT_FEATURES.exists(),
            "sha256": sha256_file(DEFAULT_FEATURES) if DEFAULT_FEATURES.exists() else None,
            "feature_record_count": feature_count,
        },
        "splits": split_summaries,
        "blockers": [
            "features are raw motion/quality proxies, not hand/pose landmarks",
            "canonical verifier rules, DTW/template decisions, thresholds, and validation are not implemented",
            "not browser-promotable model evidence",
        ],
    }
    features = {
        "schema_version": "asl-pilot-canonical-verifier-helper-features/v1-records",
        "generated_at": summary["generated_at"],
        "helper_boundary": summary["helper_boundary"],
        "splits": split_records,
    }
    return summary, features


def main() -> int:
    args = parse_args()
    summary, features = build()
    summary["generated_by"]["command"] = ["python", *[str(arg) for arg in __import__("sys").argv]]
    if args.write:
        write_json(args.output_features, features)
        summary["features"] = {
            "path": project_relative(args.output_features),
            "exists": args.output_features.exists(),
            "sha256": sha256_file(args.output_features),
            "feature_record_count": sum(len(records) for records in features["splits"].values()),
        }
        write_json(args.output_summary, summary)
    print(json.dumps({
        "status": summary["status"],
        "summary": project_relative(args.output_summary),
        "features": summary["features"],
        "split_feature_counts": {
            split: details["feature_record_count"]
            for split, details in summary["splits"].items()
        },
        "blockers": summary["blockers"],
    }, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
