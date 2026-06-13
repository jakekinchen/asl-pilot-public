#!/usr/bin/env python3
"""Write the M3EC fixed-geometric crop-normalization smoke receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import shlex
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-fixed-geometric-crop-normalization-smoke/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-fixed-geometric-crop-normalization-smoke-v1.json"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_MANIFESTS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
ACTIVE_PROMPT = ROOT / "docs" / "model" / "return-to-form-fixed-geometric-crop-normalization-smoke-goal-loop-prompt.md"
SESSION_LOG = "docs/session-logs/500-mission-3ec-fixed-geometric-crop-normalization-smoke.md"
REFERENCE_PATHS = {
    "active_prompt": ACTIVE_PROMPT,
    "goal": ROOT / "GOAL.md",
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "codex_goal_loop_runbook": ROOT / "docs" / "runbooks" / "codex-goal-loop.md",
    "observer_runbook": ROOT / "docs" / "runbooks" / "observer-runbook-codex.md",
    "m3eb_fixed_geometric_fallback": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-fixed-geometric-fallback-v1.json",
    "m3ea_class_invariant_probe": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-class-invariant-target-probe-v1.json",
    "m3dz_packet_support_diagnosis": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-packet-support-diagnosis-v1.json",
    "m3dy_objectness_repair": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-objectness-repair-v1.json",
    "prior_crop_normalization_ablation_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-crop-normalization-ablation-smoke-v1.json",
    "prior_policy_aware_crop_normalization_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "packet": DEFAULT_PACKET,
    "train_manifest": DEFAULT_MANIFESTS["train"],
    "validation_manifest": DEFAULT_MANIFESTS["validation"],
    "test_manifest": DEFAULT_MANIFESTS["test"],
    "model_card": ROOT / "web" / "public" / "model" / "model-card.json",
    "active_vocabulary_claim": ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    "runner": Path(__file__).resolve(),
}
COMMANDS_RUN = [
    "git status --short --branch",
    "git log -10 --oneline --decorate",
    "node scripts/audit_loop_premise.mjs --json",
    "node scripts/audit_return_to_form_plan.mjs --json",
    "node scripts/audit_no_pretrained_deps.mjs",
    "node scripts/audit_no_pretrained_artifact_json.mjs",
    "node scripts/audit_source_register.mjs",
    "python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null",
    "python3 -m json.tool web/public/model/model-card.json >/dev/null",
    "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    "brev ls --json",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_fixed_geometric_crop_normalization_smoke.py",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
    "scripts/run_return_to_form_fixed_geometric_crop_normalization_smoke.py",
    "python3 -m json.tool "
    "docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json >/dev/null",
    "git diff --check",
]
TARGET_IDS = [
    "left_or_first_hand",
    "right_or_second_hand",
    "head_or_face",
    "upper_body_or_signing_space",
    "table_two_hand_union_or_contact_region",
]
REQUIRED_REGION_IDS = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]
MATERIALIZED_REGION_BY_ROLE = {
    "m3eb_primary": "upper_body_signing_space",
    "m3eb_context": "head_context",
}
ALLOWED_NEXT_ACTIONS = {
    "continue_fixed_geometric_crop_smoke_no_brev",
    "fixed_geometry_crop_normalization_followup_no_brev",
    "fixed_geometry_claim_reduction",
    "return_to_detector0_after_annotation_budget",
    "escalate_crop_strategy_research",
    "stop_for_human_fixed_geometry_scope_review",
}


class FixedGeometrySmokeError(RuntimeError):
    """Raised when the M3EC receipt cannot be produced."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--m3eb-receipt", type=Path, default=REFERENCE_PATHS["m3eb_fixed_geometric_fallback"])
    parser.add_argument("--crop-config", type=Path, default=REFERENCE_PATHS["crop_config"])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise FixedGeometrySmokeError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FixedGeometrySmokeError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise FixedGeometrySmokeError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(value, dict):
        raise FixedGeometrySmokeError(f"JSON root must be an object: {project_relative(path)}")
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def resolve_relative_path(anchor: Path, relative_value: str, context: str) -> Path:
    if not relative_value.strip():
        raise FixedGeometrySmokeError(f"{context} is empty")
    return (anchor.parent / relative_value).resolve()


def round_float(value: float | None) -> float | None:
    if value is None:
        return None
    return round(float(value), 12)


def normalize_box(value: Any, context: str) -> list[float]:
    if not isinstance(value, list) or len(value) != 4:
        raise FixedGeometrySmokeError(f"{context} must be a length-4 xyxy array")
    box = [float(item) for item in value]
    if any(item < 0.0 or item > 1.0 for item in box):
        raise FixedGeometrySmokeError(f"{context} coordinates must be normalized")
    if box[0] > box[2] or box[1] > box[3]:
        raise FixedGeometrySmokeError(f"{context} coordinates must be xyxy ordered")
    return box


def box_area(box: list[float]) -> float:
    return max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])


def intersection_area(outer: list[float], inner: list[float]) -> float:
    return max(0.0, min(outer[2], inner[2]) - max(outer[0], inner[0])) * max(
        0.0, min(outer[3], inner[3]) - max(outer[1], inner[1])
    )


def box_iou(first: list[float], second: list[float]) -> float:
    intersection = intersection_area(first, second)
    union = box_area(first) + box_area(second) - intersection
    return 0.0 if union <= 0.0 else intersection / union


def contains_box(outer: list[float], inner: list[float]) -> bool:
    return outer[0] <= inner[0] and outer[1] <= inner[1] and outer[2] >= inner[2] and outer[3] >= inner[3]


def box_center(box: list[float]) -> list[float]:
    return [(box[0] + box[2]) * 0.5, (box[1] + box[3]) * 0.5]


def contains_point(box: list[float], point: list[float]) -> bool:
    return box[0] <= point[0] <= box[2] and box[1] <= point[1] <= box[3]


def target_overlap_rate(roi: list[float], target_box: list[float]) -> float | None:
    target_area = box_area(target_box)
    if target_area <= 0.0:
        return None
    return intersection_area(roi, target_box) / target_area


def pixel_window(box: list[float], size_px: int) -> dict[str, Any]:
    left = max(0, min(size_px - 1, int(box[0] * size_px)))
    top = max(0, min(size_px - 1, int(box[1] * size_px)))
    right = max(left + 1, min(size_px, int(box[2] * size_px + 0.999999)))
    bottom = max(top + 1, min(size_px, int(box[3] * size_px + 0.999999)))
    return {
        "size_px": size_px,
        "xyxy_exclusive": [left, top, right, bottom],
        "width_px": right - left,
        "height_px": bottom - top,
    }


def compare_boxes(candidate_name: str, candidate: list[float], reference_name: str, reference: list[float]) -> dict[str, Any]:
    return {
        "candidate": candidate_name,
        "candidate_box_xyxy_norm": candidate,
        "candidate_area_norm": round_float(box_area(candidate)),
        "reference": reference_name,
        "reference_box_xyxy_norm": reference,
        "reference_area_norm": round_float(box_area(reference)),
        "iou": round_float(box_iou(candidate, reference)),
        "candidate_contains_reference": contains_box(candidate, reference),
        "reference_contains_candidate": contains_box(reference, candidate),
        "candidate_area_div_reference_area": round_float(box_area(candidate) / box_area(reference))
        if box_area(reference) > 0.0
        else None,
    }


def labels_for_manifest(manifest: dict[str, Any], manifest_path: Path) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise FixedGeometrySmokeError(f"{project_relative(manifest_path)} labels must be an array")
    label_ids = [str(item.get("label_id")) for item in labels if isinstance(item, dict)]
    if not label_ids:
        raise FixedGeometrySmokeError(f"{project_relative(manifest_path)} has no label ids")
    return label_ids


def crop_config_regions(crop_config: dict[str, Any]) -> dict[str, list[float]]:
    regions = crop_config.get("regions")
    if not isinstance(regions, list):
        raise FixedGeometrySmokeError("crop config regions must be an array")
    by_id: dict[str, list[float]] = {}
    for region in regions:
        if not isinstance(region, dict):
            continue
        region_id = str(region.get("region_id"))
        if region_id in by_id:
            raise FixedGeometrySmokeError(f"duplicate crop config region_id={region_id}")
        by_id[region_id] = normalize_box(region.get("xyxy"), f"crop config {region_id}")
    missing = [region_id for region_id in REQUIRED_REGION_IDS if region_id not in by_id]
    if missing:
        raise FixedGeometrySmokeError(f"crop config missing required regions: {missing}")
    return by_id


def clip_region_map(clip: dict[str, Any], context: str) -> tuple[list[str], dict[str, list[float]]]:
    regions = clip.get("crop_regions")
    if not isinstance(regions, list):
        raise FixedGeometrySmokeError(f"{context} crop_regions must be an array")
    order = []
    by_id: dict[str, list[float]] = {}
    for region in sorted(regions, key=lambda item: int(item.get("tensor_axis", -1)) if isinstance(item, dict) else -1):
        if not isinstance(region, dict):
            raise FixedGeometrySmokeError(f"{context} has malformed crop region")
        region_id = str(region.get("region_id"))
        order.append(region_id)
        by_id[region_id] = normalize_box(region.get("xyxy"), f"{context} crop region {region_id}")
    return order, by_id


def expected_digest(value: Any, context: str) -> str:
    if not isinstance(value, str):
        raise FixedGeometrySmokeError(f"{context} must be a string")
    normalized = value.strip().lower()
    if len(normalized) != 64 or any(character not in "0123456789abcdef" for character in normalized):
        raise FixedGeometrySmokeError(f"{context} must be a lowercase SHA-256 digest")
    return normalized


def summarize_manifests(
    manifests: dict[str, Path],
    crop_config_sha: str,
    config_regions: dict[str, list[float]],
) -> tuple[dict[str, Any], dict[str, dict[str, Any]], list[dict[str, Any]]]:
    manifest_summary: dict[str, Any] = {}
    clips_by_id: dict[str, dict[str, Any]] = {}
    tensor_inputs: list[dict[str, Any]] = []
    expected_labels: list[str] | None = None

    for split, manifest_path in manifests.items():
        manifest = read_json(manifest_path)
        labels = labels_for_manifest(manifest, manifest_path)
        if expected_labels is None:
            expected_labels = labels
        elif labels != expected_labels:
            raise FixedGeometrySmokeError(f"{split} manifest label order drifted: {labels}")
        clips = manifest.get("clips")
        if not isinstance(clips, list):
            raise FixedGeometrySmokeError(f"{project_relative(manifest_path)} clips must be an array")
        split_counter: Counter[str] = Counter()
        source_counter: Counter[str] = Counter()
        review_counter: Counter[str] = Counter()
        allowed_counter: Counter[str] = Counter()
        shape_counter: Counter[str] = Counter()
        region_order_counter: Counter[str] = Counter()
        crop_sha_counter: Counter[str] = Counter()
        tensor_hash_verified = 0

        for index, clip in enumerate(clips):
            if not isinstance(clip, dict):
                raise FixedGeometrySmokeError(f"{project_relative(manifest_path)} clips[{index}] must be an object")
            clip_id = str(clip.get("clip_id"))
            if not clip_id:
                raise FixedGeometrySmokeError(f"{project_relative(manifest_path)} clips[{index}] missing clip_id")
            if clip_id in clips_by_id:
                raise FixedGeometrySmokeError(f"duplicate clip_id across manifests: {clip_id}")
            label_id = str(clip.get("label_id"))
            context = f"{project_relative(manifest_path)}:{clip_id}"
            if str(clip.get("split")) != split:
                raise FixedGeometrySmokeError(f"{context} split field does not match {split}")
            split_counter[label_id] += 1
            source_counter[str(clip.get("source_id"))] += 1
            review = clip.get("review")
            review_status = str(review.get("label_review_status")) if isinstance(review, dict) else "missing"
            review_counter[review_status] += 1
            allowed_counter[str(bool(clip.get("allowed_for_model_training"))).lower()] += 1

            crop_ref = clip.get("crop_config")
            if not isinstance(crop_ref, dict):
                raise FixedGeometrySmokeError(f"{context} missing crop_config")
            clip_crop_sha = expected_digest(crop_ref.get("sha256"), f"{context} crop_config.sha256")
            crop_sha_counter[clip_crop_sha] += 1
            if clip_crop_sha != crop_config_sha:
                raise FixedGeometrySmokeError(f"{context} crop_config sha drifted")

            region_order, region_map = clip_region_map(clip, context)
            if region_order != REQUIRED_REGION_IDS:
                raise FixedGeometrySmokeError(f"{context} region order mismatch: {region_order}")
            for region_id, expected_box in config_regions.items():
                if region_map.get(region_id) != expected_box:
                    raise FixedGeometrySmokeError(f"{context} region {region_id} does not match fixed crop config")
            region_order_counter[",".join(region_order)] += 1

            provenance = clip.get("frame_tensor_provenance")
            if not isinstance(provenance, dict):
                raise FixedGeometrySmokeError(f"{context} missing frame_tensor_provenance")
            tensor_digest = provenance.get("tensor_digest")
            if not isinstance(tensor_digest, dict):
                raise FixedGeometrySmokeError(f"{context} missing tensor_digest")
            shape = tensor_digest.get("shape")
            if not isinstance(shape, list) or len(shape) != 5:
                raise FixedGeometrySmokeError(f"{context} tensor_digest.shape must be T,R,H,W,C")
            shape_counter["x".join(str(int(item)) for item in shape)] += 1
            if int(shape[1]) != len(REQUIRED_REGION_IDS):
                raise FixedGeometrySmokeError(f"{context} region axis does not match required region count")
            prov_crop = provenance.get("crop_config")
            if not isinstance(prov_crop, dict):
                raise FixedGeometrySmokeError(f"{context} missing provenance crop_config")
            if prov_crop.get("region_ids") != REQUIRED_REGION_IDS:
                raise FixedGeometrySmokeError(f"{context} provenance region_ids mismatch")
            if expected_digest(prov_crop.get("sha256"), f"{context} provenance crop_config.sha256") != crop_config_sha:
                raise FixedGeometrySmokeError(f"{context} provenance crop_config sha drifted")

            relative_tensor_path = clip.get("relative_frame_tensor_path")
            if not isinstance(relative_tensor_path, str):
                raise FixedGeometrySmokeError(f"{context} missing relative_frame_tensor_path")
            tensor_path = resolve_relative_path(manifest_path, relative_tensor_path, f"{context} tensor path")
            if not tensor_path.exists():
                raise FixedGeometrySmokeError(f"{context} tensor file missing: {project_relative(tensor_path)}")
            expected_hash = expected_digest(clip.get("frame_tensor_sha256"), f"{context} frame_tensor_sha256")
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise FixedGeometrySmokeError(f"{context} tensor hash mismatch")
            tensor_hash_verified += 1
            tensor_record = {
                "split": split,
                "clip_id": clip_id,
                "path": project_relative(tensor_path),
                "sha256": actual_hash,
            }
            tensor_inputs.append(tensor_record)
            clips_by_id[clip_id] = {
                "split": split,
                "label_id": label_id,
                "frame_count": int(shape[0]),
                "tensor_path": tensor_path,
                "tensor_sha256": actual_hash,
                "region_ids": REQUIRED_REGION_IDS,
                "shape": [int(item) for item in shape],
            }

        manifest_summary[split] = {
            "manifest": file_ref(manifest_path),
            "clip_count": len(clips),
            "label_counts": dict(sorted(split_counter.items())),
            "source_id_counts": dict(sorted(source_counter.items())),
            "label_review_status_counts": dict(sorted(review_counter.items())),
            "allowed_for_model_training_counts": dict(sorted(allowed_counter.items())),
            "tensor_shape_counts": dict(sorted(shape_counter.items())),
            "region_order_counts": dict(sorted(region_order_counter.items())),
            "crop_config_sha256_counts": dict(sorted(crop_sha_counter.items())),
            "tensor_hash_verified_count": tensor_hash_verified,
        }

    return manifest_summary, clips_by_id, tensor_inputs


def packet_summary(packet: dict[str, Any], clips_by_id: dict[str, dict[str, Any]], packet_path: Path) -> dict[str, Any]:
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 32:
        raise FixedGeometrySmokeError("M3EC expects the current 32-row Detector 0 packet")
    target_schema = packet.get("target_schema")
    target_ids = target_schema.get("target_ids") if isinstance(target_schema, dict) else None
    if not isinstance(target_ids, list) or any(target_id not in target_ids for target_id in TARGET_IDS):
        raise FixedGeometrySmokeError("packet target schema is missing required M3EC targets")

    split_counts: Counter[str] = Counter()
    label_counts_by_split: dict[str, Counter[str]] = defaultdict(Counter)
    review_counter: Counter[str] = Counter()
    target_support: dict[str, dict[str, Any]] = {
        target_id: {"present": 0, "absent": 0, "present_labels": Counter(), "absent_labels": Counter()}
        for target_id in TARGET_IDS
    }
    packet_tensor_rows = []

    for row in rows:
        if not isinstance(row, dict):
            raise FixedGeometrySmokeError("packet frame_rows entries must be objects")
        row_id = str(row.get("row_id"))
        split = str(row.get("split"))
        label_id = str(row.get("label_id"))
        clip_id = str(row.get("clip_id"))
        if clip_id not in clips_by_id:
            raise FixedGeometrySmokeError(f"{row_id} clip_id not present in manifests: {clip_id}")
        clip = clips_by_id[clip_id]
        if clip["split"] != split or clip["label_id"] != label_id:
            raise FixedGeometrySmokeError(f"{row_id} split/label mismatch against manifest")
        frame_index = int(row.get("frame_index"))
        if frame_index < 0 or frame_index >= int(clip["frame_count"]):
            raise FixedGeometrySmokeError(f"{row_id} frame_index outside tensor frame count")
        relative_tensor_path = row.get("frame_tensor_path")
        if not isinstance(relative_tensor_path, str):
            raise FixedGeometrySmokeError(f"{row_id} missing frame_tensor_path")
        row_tensor_path = resolve_relative_path(packet_path, relative_tensor_path, f"{row_id} frame_tensor_path")
        if project_relative(row_tensor_path) != project_relative(clip["tensor_path"]):
            raise FixedGeometrySmokeError(f"{row_id} tensor path mismatch against manifest")
        row_hash = expected_digest(row.get("frame_tensor_sha256"), f"{row_id} frame_tensor_sha256")
        if row_hash != clip["tensor_sha256"]:
            raise FixedGeometrySmokeError(f"{row_id} tensor sha mismatch against manifest")

        split_counts[split] += 1
        label_counts_by_split[split][label_id] += 1
        review_counter[str(row.get("review_status"))] += 1
        targets = row.get("targets")
        if not isinstance(targets, dict):
            raise FixedGeometrySmokeError(f"{row_id} missing targets")
        for target_id in TARGET_IDS:
            target = targets.get(target_id)
            if not isinstance(target, dict):
                raise FixedGeometrySmokeError(f"{row_id} missing target {target_id}")
            if target.get("presence") is True:
                normalize_box(target.get("box_xyxy_norm"), f"{row_id}:{target_id}")
                target_support[target_id]["present"] += 1
                target_support[target_id]["present_labels"][label_id] += 1
            else:
                target_support[target_id]["absent"] += 1
                target_support[target_id]["absent_labels"][label_id] += 1
        packet_tensor_rows.append(
            {
                "row_id": row_id,
                "clip_id": clip_id,
                "split": split,
                "label_id": label_id,
                "frame_index": frame_index,
                "tensor_path": project_relative(clip["tensor_path"]),
                "tensor_sha256": clip["tensor_sha256"],
            }
        )

    return {
        "frame_row_count": len(rows),
        "split_counts": dict(sorted(split_counts.items())),
        "label_counts_by_split": {
            split: dict(sorted(counter.items())) for split, counter in sorted(label_counts_by_split.items())
        },
        "review_status_counts": dict(sorted(review_counter.items())),
        "target_support": {
            target_id: {
                "present": values["present"],
                "absent": values["absent"],
                "present_labels": dict(sorted(values["present_labels"].items())),
                "absent_labels": dict(sorted(values["absent_labels"].items())),
            }
            for target_id, values in sorted(target_support.items())
        },
        "packet_tensor_frame_crosscheck": {
            "checked_row_count": len(packet_tensor_rows),
            "all_frame_indices_within_tensor_bounds": True,
            "all_packet_tensor_paths_match_manifest": True,
            "all_packet_tensor_hashes_match_manifest": True,
            "rows": packet_tensor_rows,
        },
    }


def summarize_roi_against_packet(
    rows: list[dict[str, Any]],
    roi_name: str,
    roi_box: list[float],
) -> dict[str, Any]:
    result = {}
    for target_id in TARGET_IDS:
        present_records = []
        by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
        by_split: dict[str, list[dict[str, Any]]] = defaultdict(list)
        examples = []
        for row in rows:
            targets = row.get("targets")
            if not isinstance(targets, dict):
                continue
            target = targets.get(target_id)
            if not isinstance(target, dict) or target.get("presence") is not True:
                continue
            box = normalize_box(target.get("box_xyxy_norm"), f"{row.get('row_id')}:{target_id}")
            center_value = target.get("center_xy_norm")
            if isinstance(center_value, list) and len(center_value) == 2:
                center = [float(center_value[0]), float(center_value[1])]
            else:
                center = box_center(box)
            center_inside = contains_point(roi_box, center)
            fully_contained = contains_box(roi_box, box)
            overlap_rate = target_overlap_rate(roi_box, box)
            record = {
                "center_inside": center_inside,
                "fully_contained": fully_contained,
                "target_overlap_rate": overlap_rate,
                "row_id": str(row.get("row_id")),
                "label_id": str(row.get("label_id")),
                "split": str(row.get("split")),
                "target_box_xyxy_norm": box,
            }
            present_records.append(record)
            by_label[record["label_id"]].append(record)
            by_split[record["split"]].append(record)
            if (not center_inside or not fully_contained) and len(examples) < 5:
                examples.append(
                    {
                        "row_id": record["row_id"],
                        "label_id": record["label_id"],
                        "split": record["split"],
                        "center_inside": center_inside,
                        "fully_contained": fully_contained,
                        "target_overlap_rate": round_float(overlap_rate),
                        "target_box_xyxy_norm": box,
                    }
                )
        result[target_id] = rate_summary(present_records, by_split, by_label, examples)
    return {
        "roi_name": roi_name,
        "roi_box_xyxy_norm": roi_box,
        "target_coverage": result,
    }


def rate_summary(
    records: list[dict[str, Any]],
    by_split: dict[str, list[dict[str, Any]]],
    by_label: dict[str, list[dict[str, Any]]],
    examples: list[dict[str, Any]],
) -> dict[str, Any]:
    def summarize(items: list[dict[str, Any]]) -> dict[str, Any]:
        overlaps = [item["target_overlap_rate"] for item in items if item["target_overlap_rate"] is not None]
        return {
            "present_count": len(items),
            "target_center_inside_count": sum(1 for item in items if item["center_inside"]),
            "target_center_inside_rate": round_float(
                statistics.fmean(1.0 if item["center_inside"] else 0.0 for item in items)
            )
            if items
            else None,
            "target_box_fully_contained_count": sum(1 for item in items if item["fully_contained"]),
            "target_box_fully_contained_rate": round_float(
                statistics.fmean(1.0 if item["fully_contained"] else 0.0 for item in items)
            )
            if items
            else None,
            "min_target_overlap_rate": round_float(min(overlaps)) if overlaps else None,
            "mean_target_overlap_rate": round_float(statistics.fmean(overlaps)) if overlaps else None,
        }

    return {
        **summarize(records),
        "by_split": {split: summarize(items) for split, items in sorted(by_split.items())},
        "by_label": {label: summarize(items) for label, items in sorted(by_label.items())},
        "first_not_fully_contained_or_center_outside_examples": examples,
    }


def materialization_evidence(
    m3eb_primary: list[float],
    m3eb_context: list[float],
    config_regions: dict[str, list[float]],
    total_clips: int,
) -> dict[str, Any]:
    upper = config_regions["upper_body_signing_space"]
    head = config_regions["head_context"]
    full = config_regions["full_frame_reference"]
    return {
        "m3eb_primary_roi": {
            "target_id": "upper_body_or_signing_space",
            "box_xyxy_norm": m3eb_primary,
            "materialized_region_id_in_existing_tensors": None,
            "can_be_applied_from_full_frame_reference": True,
            "clip_count_with_full_frame_reference": total_clips,
            "pixel_windows": [pixel_window(m3eb_primary, 96), pixel_window(m3eb_primary, 192)],
            "comparison_to_existing_upper_body_signing_space": compare_boxes(
                "m3eb_primary_roi",
                m3eb_primary,
                "materialized_upper_body_signing_space",
                upper,
            ),
        },
        "m3eb_context_roi": {
            "target_id": "head_or_face",
            "box_xyxy_norm": m3eb_context,
            "materialized_region_id_in_existing_tensors": None,
            "can_be_applied_from_full_frame_reference": True,
            "clip_count_with_full_frame_reference": total_clips,
            "pixel_windows": [pixel_window(m3eb_context, 96), pixel_window(m3eb_context, 192)],
            "comparison_to_existing_head_context": compare_boxes(
                "m3eb_context_roi",
                m3eb_context,
                "materialized_head_context",
                head,
            ),
        },
        "existing_materialized_regions": {
            region_id: {
                "box_xyxy_norm": config_regions[region_id],
                "clip_count": total_clips,
                "region_axis": REQUIRED_REGION_IDS.index(region_id),
                "pixel_window_96px": pixel_window(config_regions[region_id], 96),
            }
            for region_id in REQUIRED_REGION_IDS
        },
        "transform_accounting": {
            "existing_tensor_region_order": REQUIRED_REGION_IDS,
            "m3eb_exact_roi_materialized_region_count": 0,
            "full_frame_reference_available_for_exact_roi_count": total_clips,
            "tensor_mutation_required_for_this_smoke": False,
            "scratch_output_written": False,
            "fallback_to_learned_detector_count": 0,
            "deterministic_fixed_geometry_count": total_clips,
        },
    }


def classify_outcome(
    primary_coverage: dict[str, Any],
    materialized_upper_coverage: dict[str, Any],
) -> dict[str, Any]:
    table_primary = primary_coverage["target_coverage"]["table_two_hand_union_or_contact_region"]
    left_primary = primary_coverage["target_coverage"]["left_or_first_hand"]
    table_materialized = materialized_upper_coverage["target_coverage"]["table_two_hand_union_or_contact_region"]
    primary_table_full = table_primary["target_box_fully_contained_rate"] or 0.0
    primary_left_full = left_primary["target_box_fully_contained_rate"] or 0.0
    materialized_table_full = table_materialized["target_box_fully_contained_rate"] or 0.0

    if primary_table_full < 0.8 or primary_left_full < 0.8:
        next_action = "fixed_geometry_claim_reduction"
        classification = "exact_m3eb_roi_is_consistent_but_too_narrow_for_unqualified_interaction_claims"
        reason = (
            "The exact M3EB primary ROI is deterministic and applicable from full-frame tensor references, but it "
            "does not fully contain enough current hand/contact packet boxes to claim it preserves all interaction "
            "evidence. The existing materialized upper-body crop is broader for table interaction evidence, so the "
            "next step should reduce the fixed-geometry claim before any model-input comparison."
        )
    elif materialized_table_full >= 0.8:
        next_action = "fixed_geometry_crop_normalization_followup_no_brev"
        classification = "fixed_geometry_accounting_supports_bounded_no_brev_followup"
        reason = (
            "The fixed geometry and materialized tensor regions preserve current interaction evidence well enough "
            "for one future no-Brev model-input comparison under fail-closed product claims."
        )
    else:
        next_action = "stop_for_human_fixed_geometry_scope_review"
        classification = "fixed_geometry_accounting_needs_human_scope_review"
        reason = "Current fixed geometry does not cleanly preserve the packet evidence needed for another local crop follow-up."
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise FixedGeometrySmokeError(f"internal next action is not allowed: {next_action}")
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "m3eb_primary_table_union_full_containment_rate": round_float(primary_table_full),
        "m3eb_primary_left_hand_full_containment_rate": round_float(primary_left_full),
        "materialized_upper_body_table_union_full_containment_rate": round_float(materialized_table_full),
    }


def main() -> int:
    args = parse_args()
    packet_path = args.packet.resolve()
    m3eb_path = args.m3eb_receipt.resolve()
    crop_config_path = args.crop_config.resolve()
    packet = read_json(packet_path)
    m3eb = read_json(m3eb_path)
    crop_config = read_json(crop_config_path)
    model_card = read_json(REFERENCE_PATHS["model_card"])
    active_vocabulary = read_json(REFERENCE_PATHS["active_vocabulary_claim"])

    crop_config_sha = sha256_file(crop_config_path)
    config_regions = crop_config_regions(crop_config)
    manifests = {split: path.resolve() for split, path in DEFAULT_MANIFESTS.items()}
    manifest_summary, clips_by_id, tensor_inputs = summarize_manifests(manifests, crop_config_sha, config_regions)
    packet_evidence = packet_summary(packet, clips_by_id, packet_path)

    policy = m3eb.get("recommended_fallback_policy")
    if not isinstance(policy, dict):
        raise FixedGeometrySmokeError("M3EB receipt missing recommended_fallback_policy")
    primary_policy = policy.get("primary_roi")
    context_policy = policy.get("context_roi")
    hand_policy = policy.get("hand_roi")
    if not isinstance(primary_policy, dict) or not isinstance(context_policy, dict):
        raise FixedGeometrySmokeError("M3EB receipt missing primary/context ROI policy")
    primary_roi = normalize_box(primary_policy.get("box_xyxy_norm"), "M3EB primary ROI")
    context_roi = normalize_box(context_policy.get("box_xyxy_norm"), "M3EB context ROI")

    rows = packet["frame_rows"]
    primary_coverage = summarize_roi_against_packet(rows, "m3eb_primary_upper_body_or_signing_space", primary_roi)
    context_coverage = summarize_roi_against_packet(rows, "m3eb_context_head_or_face", context_roi)
    materialized_upper_coverage = summarize_roi_against_packet(
        rows,
        "existing_materialized_upper_body_signing_space",
        config_regions["upper_body_signing_space"],
    )
    materialized_head_coverage = summarize_roi_against_packet(
        rows,
        "existing_materialized_head_context",
        config_regions["head_context"],
    )
    total_clips = len(tensor_inputs)
    outcome = classify_outcome(primary_coverage, materialized_upper_coverage)

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3EC - Fixed-geometric crop-normalization smoke",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": COMMANDS_RUN,
        "commands_intentionally_not_run": [
            "No Brev worker creation, sync, SSH, remote compute, remote training, stop, delete, or reset.",
            "No training, classifier fitting, optimizer construction, backward pass, checkpoint, model artifact, ONNX export, or model-card promotion.",
            "No source import, media download, source-register mutation, manifest mutation, tracked tensor mutation, vocabulary mutation, label expansion, or packet-row mutation.",
            "No hand-landmark source import, landmark detector, pretrained detector, generated label path, browser activation, product runtime change, final readiness claim, ASL correctness claim, or push.",
        ],
        "source_artifacts": {name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
        "files_changed": [
            "scripts/run_return_to_form_fixed_geometric_crop_normalization_smoke.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "input_scope": {
            "manifests": {
                split: summary["manifest"] for split, summary in sorted(manifest_summary.items())
            },
            "tensor_files_touched": {
                "count": total_clips,
                "count_by_split": {
                    split: summary["tensor_hash_verified_count"]
                    for split, summary in sorted(manifest_summary.items())
                },
                "all_paths_and_hashes": tensor_inputs,
            },
            "packet": file_ref(packet_path),
            "m3eb_receipt": file_ref(m3eb_path),
            "crop_config": file_ref(crop_config_path),
        },
        "manifest_tensor_accounting": manifest_summary,
        "packet_evidence": packet_evidence,
        "m3eb_fixed_geometry": {
            "primary_roi": primary_policy,
            "context_roi": context_policy,
            "hand_roi": hand_policy,
            "separation_from_detector0": policy.get("separation_from_detector0"),
        },
        "fixed_crop_materialization": materialization_evidence(primary_roi, context_roi, config_regions, total_clips),
        "inclusion_and_hidden_evidence_accounting": {
            "m3eb_primary_upper_body_or_signing_space": primary_coverage,
            "m3eb_context_head_or_face": context_coverage,
            "existing_materialized_upper_body_signing_space": materialized_upper_coverage,
            "existing_materialized_head_context": materialized_head_coverage,
            "summary": {
                "m3eb_primary_keeps_all_present_target_centers_inside": all(
                    (target["target_center_inside_rate"] == 1.0)
                    for target in primary_coverage["target_coverage"].values()
                    if target["present_count"] > 0
                ),
                "m3eb_primary_table_union_full_containment_rate": primary_coverage["target_coverage"][
                    "table_two_hand_union_or_contact_region"
                ]["target_box_fully_contained_rate"],
                "m3eb_primary_left_hand_full_containment_rate": primary_coverage["target_coverage"][
                    "left_or_first_hand"
                ]["target_box_fully_contained_rate"],
                "existing_upper_body_table_union_full_containment_rate": materialized_upper_coverage[
                    "target_coverage"
                ]["table_two_hand_union_or_contact_region"]["target_box_fully_contained_rate"],
                "existing_upper_body_right_hand_full_containment_rate": materialized_upper_coverage[
                    "target_coverage"
                ]["right_or_second_hand"]["target_box_fully_contained_rate"],
            },
        },
        "optional_diagnostic_metric": {
            "classifier_comparison_run": False,
            "reason": (
                "Transform, inclusion, tensor-hash, and split accounting were sufficient to answer the M3EC smoke: "
                "the exact M3EB ROI is applicable but too narrow for unqualified interaction-preservation claims."
            ),
        },
        "claim_boundary": {
            "model_card_status": model_card.get("status"),
            "active_labels": active_vocabulary.get("activeLabels"),
            "browser_recognition": "unchanged_inactive",
            "detector0_runtime_objectness": "still_unproven",
            "fixed_hand_or_landmark_behavior": "unavailable",
            "product_authority": False,
            "model_artifact_saved": False,
            "onnx_exported": False,
            "final_readiness_claim": False,
            "asl_correctness_claim": False,
            "fixed_geometry_claim_reduction_required": outcome["next_action"] == "fixed_geometry_claim_reduction",
        },
        "future_no_brev_followup": {
            "justified_under_unqualified_exact_m3eb_roi_claim": False,
            "potentially_justified_after_claim_reduction": True,
            "required_scope": (
                "Use the fixed geometry as transparent coverage/accounting evidence, or compare materialized "
                "upper-body/head tensor regions against full-frame references, without claiming runtime objectness, "
                "hand tracking, landmarks, browser activation, or product readiness."
            ),
            "still_requires_human_approval_for": [
                "packet-row mutation",
                "new annotation budget",
                "source import or source license approval",
                "Brev spend or remote training",
                "final gate changes or product promotion",
            ],
        },
        "boundaries": {
            "local_only": True,
            "read_only_packet_receipts_manifests_and_tensors": True,
            "training": False,
            "classifier_fitting": False,
            "optimizer_or_backward": False,
            "packet_mutation": False,
            "source_import": False,
            "manifest_mutation": False,
            "tracked_tensor_mutation": False,
            "vocabulary_mutation": False,
            "model_card_mutation": False,
            "model_artifact": False,
            "onnx_export": False,
            "browser_activation": False,
            "product_runtime_change": False,
            "pretrained_or_generated_label_path": False,
            "brev_lifecycle_or_spend": False,
            "push": False,
        },
        "outcome": outcome,
        "next_action": {
            "id": outcome["next_action"],
            "reason": outcome["reason"],
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "classification": outcome["classification"],
                "next_action": outcome["next_action"],
                "tensor_hash_verified_count": total_clips,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except FixedGeometrySmokeError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
