#!/usr/bin/env python3
"""Write the M3EB fixed-geometric Detector 0 fallback receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import shlex
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-detector0-fixed-geometric-fallback/v1"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_M3EA_RECEIPT = (
    ROOT / "docs" / "validation" / "return-to-form-detector0-class-invariant-target-probe-v1.json"
)
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-detector0-fixed-geometric-fallback-v1.json"
SESSION_LOG = "docs/session-logs/498-mission-3eb-detector0-fixed-geometric-fallback.md"
CLASS_INVARIANT_TARGET_IDS = [
    "upper_body_or_signing_space",
    "head_or_face",
    "left_or_first_hand",
]
COMPARISON_TARGET_IDS = [
    "upper_body_or_signing_space",
    "head_or_face",
    "left_or_first_hand",
    "right_or_second_hand",
    "table_two_hand_union_or_contact_region",
]
REFERENCE_PATHS = {
    "active_prompt": ROOT
    / "docs"
    / "model"
    / "return-to-form-detector0-fixed-geometric-fallback-goal-loop-prompt.md",
    "goal": ROOT / "GOAL.md",
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "m3ea_class_invariant_probe": DEFAULT_M3EA_RECEIPT,
    "m3dz_packet_support_diagnosis": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-packet-support-diagnosis-v1.json",
    "m3dy_objectness_repair": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-objectness-repair-v1.json",
    "packet": DEFAULT_PACKET,
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
    "python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null",
    "python3 -m json.tool web/public/model/model-card.json >/dev/null",
    "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    "brev ls --json",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_detector0_fixed_geometric_fallback.py",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
    "scripts/run_return_to_form_detector0_fixed_geometric_fallback.py",
    "python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null",
    "git diff --check",
]


class FixedFallbackError(RuntimeError):
    """Raised when the fixed-geometric fallback receipt cannot be produced."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--m3ea-receipt", type=Path, default=DEFAULT_M3EA_RECEIPT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FixedFallbackError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise FixedFallbackError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(value, dict):
        raise FixedFallbackError(f"JSON root must be an object: {project_relative(path)}")
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise FixedFallbackError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def validate_box(row_id: str, target_id: str, box: Any) -> list[float]:
    if not isinstance(box, list) or len(box) != 4:
        raise FixedFallbackError(f"{row_id}:{target_id} box must be a length-4 array")
    coords = [float(value) for value in box]
    if any(value < 0.0 or value > 1.0 for value in coords):
        raise FixedFallbackError(f"{row_id}:{target_id} box coordinates must be normalized")
    if coords[0] > coords[2] or coords[1] > coords[3]:
        raise FixedFallbackError(f"{row_id}:{target_id} box must be xyxy ordered")
    return coords


def box_area(box: list[float]) -> float:
    return max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])


def box_iou(predicted: list[float], target: list[float]) -> float:
    x1 = max(predicted[0], target[0])
    y1 = max(predicted[1], target[1])
    x2 = min(predicted[2], target[2])
    y2 = min(predicted[3], target[3])
    intersection = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    union = box_area(predicted) + box_area(target) - intersection
    return 0.0 if union <= 0.0 else intersection / union


def box_mae(predicted: list[float], target: list[float]) -> float:
    return statistics.fmean(abs(a - b) for a, b in zip(predicted, target, strict=True))


def box_center(box: list[float]) -> list[float]:
    return [(box[0] + box[2]) * 0.5, (box[1] + box[3]) * 0.5]


def contains_point(box: list[float], point: list[float]) -> bool:
    return box[0] <= point[0] <= box[2] and box[1] <= point[1] <= box[3]


def contains_box(outer: list[float], inner: list[float]) -> bool:
    return outer[0] <= inner[0] and outer[1] <= inner[1] and outer[2] >= inner[2] and outer[3] >= inner[3]


def median_box(boxes: list[list[float]]) -> list[float]:
    return [float(statistics.median(box[index] for box in boxes)) for index in range(4)]


def mean_box(boxes: list[list[float]]) -> list[float]:
    return [float(statistics.fmean(box[index] for box in boxes)) for index in range(4)]


def envelope_box(boxes: list[list[float]]) -> list[float]:
    return [
        min(box[0] for box in boxes),
        min(box[1] for box in boxes),
        max(box[2] for box in boxes),
        max(box[3] for box in boxes),
    ]


def distribution(values: list[float]) -> dict[str, Any]:
    if not values:
        return {"count": 0, "min": None, "median": None, "mean": None, "max": None}
    return {
        "count": len(values),
        "min": min(values),
        "median": statistics.median(values),
        "mean": statistics.fmean(values),
        "max": max(values),
    }


def coordinate_ranges(boxes: list[list[float]]) -> dict[str, Any]:
    names = ["x1", "y1", "x2", "y2"]
    return {
        name: distribution([box[index] for box in boxes])
        for index, name in enumerate(names)
    }


def evaluate_candidate(candidate_box: list[float], boxes_by_split: dict[str, list[list[float]]]) -> dict[str, Any]:
    result = {}
    for split in ("train", "validation", "test", "all"):
        boxes = boxes_by_split[split]
        maes = [box_mae(candidate_box, box) for box in boxes]
        ious = [box_iou(candidate_box, box) for box in boxes]
        center_inside = [contains_point(candidate_box, box_center(box)) for box in boxes]
        contains_target = [contains_box(candidate_box, box) for box in boxes]
        result[split] = {
            "sample_count": len(boxes),
            "candidate_box_xyxy_norm": candidate_box,
            "candidate_area_norm": box_area(candidate_box),
            "box_mae": statistics.fmean(maes) if maes else None,
            "mean_iou": statistics.fmean(ious) if ious else None,
            "min_iou": min(ious) if ious else None,
            "target_center_inside_rate": statistics.fmean(1.0 if item else 0.0 for item in center_inside)
            if center_inside
            else None,
            "target_box_fully_contained_rate": statistics.fmean(1.0 if item else 0.0 for item in contains_target)
            if contains_target
            else None,
        }
    return result


def load_target_boxes(packet: dict[str, Any]) -> tuple[dict[str, dict[str, list[list[float]]]], dict[str, Any]]:
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 32:
        raise FixedFallbackError("M3EB fallback expects exactly 32 packet rows")
    target_ids = packet.get("target_schema", {}).get("target_ids")
    if not isinstance(target_ids, list) or any(target_id not in target_ids for target_id in COMPARISON_TARGET_IDS):
        raise FixedFallbackError("packet target schema does not include the M3EB comparison targets")

    boxes_by_target: dict[str, dict[str, list[list[float]]]] = {
        target_id: {split: [] for split in ("train", "validation", "test", "all")}
        for target_id in COMPARISON_TARGET_IDS
    }
    support: dict[str, Any] = {}
    counts_by_split: Counter[str] = Counter()
    labels_by_split: dict[str, Counter[str]] = defaultdict(Counter)

    for row in rows:
        if not isinstance(row, dict):
            raise FixedFallbackError("packet frame_rows entries must be objects")
        row_id = str(row.get("row_id"))
        split = str(row.get("split"))
        label_id = str(row.get("label_id"))
        if split not in {"train", "validation", "test"}:
            raise FixedFallbackError(f"{row_id} has unsupported split={split}")
        counts_by_split[split] += 1
        labels_by_split[split][label_id] += 1
        targets = row.get("targets")
        if not isinstance(targets, dict):
            raise FixedFallbackError(f"{row_id} missing targets")

        for target_id in COMPARISON_TARGET_IDS:
            target = targets.get(target_id)
            if not isinstance(target, dict):
                raise FixedFallbackError(f"{row_id} missing target {target_id}")
            present = bool(target.get("presence"))
            support.setdefault(target_id, {"present": 0, "absent": 0, "present_labels": Counter(), "absent_labels": Counter()})
            if present:
                box = validate_box(row_id, target_id, target.get("box_xyxy_norm"))
                boxes_by_target[target_id][split].append(box)
                boxes_by_target[target_id]["all"].append(box)
                support[target_id]["present"] += 1
                support[target_id]["present_labels"][label_id] += 1
            else:
                support[target_id]["absent"] += 1
                support[target_id]["absent_labels"][label_id] += 1

    packet_summary = {
        "frame_row_count": len(rows),
        "split_counts": dict(counts_by_split),
        "label_counts_by_split": {
            split: dict(sorted(counter.items())) for split, counter in sorted(labels_by_split.items())
        },
        "target_support": {
            target_id: {
                "present": values["present"],
                "absent": values["absent"],
                "present_labels": dict(sorted(values["present_labels"].items())),
                "absent_labels": dict(sorted(values["absent_labels"].items())),
            }
            for target_id, values in sorted(support.items())
        },
    }
    return boxes_by_target, packet_summary


def candidate_assessment(target_id: str, candidate_metrics: dict[str, Any]) -> dict[str, Any]:
    train_median = candidate_metrics["train_median_box"]["per_split_metrics"]
    validation = train_median["validation"]
    test = train_median["test"]
    if target_id == "upper_body_or_signing_space":
        status = "recommended_primary_fixed_geometry"
        reason = (
            "Train-median upper-body/signing-space geometry is stable across held-out rows and can be used as a "
            "transparent fixed crop fallback, not as Detector 0 objectness."
        )
    elif target_id == "head_or_face":
        status = "recommended_context_fixed_geometry"
        reason = (
            "Train-median head/face geometry is stable enough for context accounting, but it is not a hand or "
            "runtime objectness detector."
        )
    elif (
        validation["mean_iou"] is not None
        and test["mean_iou"] is not None
        and validation["mean_iou"] >= 0.75
        and test["mean_iou"] >= 0.75
    ):
        status = "candidate_fixed_geometry"
        reason = "Train-median fixed box has acceptable held-out overlap for a transparent fallback candidate."
    else:
        status = "diagnostic_only_not_precise_fixed_roi"
        reason = (
            "Train-median fixed hand geometry has too much held-out variation for a precise hand ROI. It can inform "
            "scope or coverage checks, but should not be treated as a hand detector."
        )
    return {
        "status": status,
        "reason": reason,
        "heldout_train_median_box_metrics": {
            "validation": validation,
            "test": test,
        },
    }


def fixed_geometry_candidates(boxes_by_target: dict[str, dict[str, list[list[float]]]]) -> dict[str, Any]:
    result = {}
    for target_id in CLASS_INVARIANT_TARGET_IDS:
        boxes_by_split = boxes_by_target[target_id]
        if not boxes_by_split["train"]:
            raise FixedFallbackError(f"{target_id} has no train boxes")
        train_median = median_box(boxes_by_split["train"])
        train_mean = mean_box(boxes_by_split["train"])
        train_envelope = envelope_box(boxes_by_split["train"])
        all_median = median_box(boxes_by_split["all"])
        all_envelope = envelope_box(boxes_by_split["all"])
        candidate_metrics = {
            "train_median_box": {
                "box_xyxy_norm": train_median,
                "derivation": "coordinate-wise median over train split approved packet boxes only",
                "per_split_metrics": evaluate_candidate(train_median, boxes_by_split),
            },
            "train_mean_box": {
                "box_xyxy_norm": train_mean,
                "derivation": "coordinate-wise mean over train split approved packet boxes only",
                "per_split_metrics": evaluate_candidate(train_mean, boxes_by_split),
            },
            "train_envelope_box": {
                "box_xyxy_norm": train_envelope,
                "derivation": "min x1/y1 and max x2/y2 over train split approved packet boxes only",
                "per_split_metrics": evaluate_candidate(train_envelope, boxes_by_split),
            },
            "all_rows_median_box_descriptive_only": {
                "box_xyxy_norm": all_median,
                "derivation": "descriptive coordinate-wise median over all current packet rows; not used to lock future held-out smoke geometry",
                "per_split_metrics": evaluate_candidate(all_median, boxes_by_split),
            },
            "all_rows_envelope_box_descriptive_only": {
                "box_xyxy_norm": all_envelope,
                "derivation": "descriptive full-packet envelope; not used to lock future held-out smoke geometry",
                "per_split_metrics": evaluate_candidate(all_envelope, boxes_by_split),
            },
        }
        result[target_id] = {
            "box_counts": {split: len(boxes_by_split[split]) for split in ("train", "validation", "test", "all")},
            "coordinate_ranges_by_split": {
                split: coordinate_ranges(boxes_by_split[split]) for split in ("train", "validation", "test", "all")
            },
            "candidates": candidate_metrics,
            "assessment": candidate_assessment(target_id, candidate_metrics),
        }
    return result


def m3ea_crosscheck(m3ea_receipt: dict[str, Any]) -> dict[str, Any]:
    support = m3ea_receipt.get("packet_and_target_support", {}).get("target_support", {})
    outcome = m3ea_receipt.get("outcome", {})
    probe_results = m3ea_receipt.get("probe_results", {})
    return {
        "m3ea_next_action": m3ea_receipt.get("next_action", {}).get("id"),
        "m3ea_classification": outcome.get("classification"),
        "dynamic_spatial_candidates": outcome.get("dynamic_spatial_candidates"),
        "target_cell_only_candidates": outcome.get("target_cell_only_candidates"),
        "class_invariant_support": {
            target_id: support.get(target_id, {}).get("global") for target_id in CLASS_INVARIANT_TARGET_IDS
        },
        "m3ea_train_median_box_metrics": {
            target_id: {
                split: probe_results.get(target_id, {}).get("metrics", {}).get(split, {}).get("box_localization", {})
                for split in ("train", "validation", "test")
            }
            for target_id in CLASS_INVARIANT_TARGET_IDS
        },
    }


def classify_outcome(candidates: dict[str, Any]) -> dict[str, Any]:
    upper = candidates["upper_body_or_signing_space"]["candidates"]["train_median_box"]["per_split_metrics"]
    head = candidates["head_or_face"]["candidates"]["train_median_box"]["per_split_metrics"]
    upper_heldout_ok = all(
        upper[split]["mean_iou"] is not None
        and upper[split]["mean_iou"] >= 0.90
        and upper[split]["box_mae"] is not None
        and upper[split]["box_mae"] <= 0.02
        for split in ("validation", "test")
    )
    head_heldout_ok = all(
        head[split]["mean_iou"] is not None
        and head[split]["mean_iou"] >= 0.90
        and head[split]["box_mae"] is not None
        and head[split]["box_mae"] <= 0.02
        for split in ("validation", "test")
    )
    if upper_heldout_ok:
        next_action = "prepare_fixed_geometric_crop_normalization_smoke_no_brev"
        classification = "fixed_geometric_upper_body_fallback_justifies_no_brev_crop_smoke_design"
        reason = (
            "The train-derived upper-body/signing-space fixed box is stable on validation/test and can support a "
            "transparent fixed-geometry crop-normalization smoke. This does not revive Detector 0 runtime "
            "objectness or product claims."
        )
    elif upper_heldout_ok or head_heldout_ok:
        next_action = "continue_fixed_geometric_fallback_design_no_brev"
        classification = "partial_fixed_geometry_needs_more_design"
        reason = "Some fixed geometry is stable, but the fallback packet is not yet concrete enough for a crop smoke."
    else:
        next_action = "stop_for_human_fixed_geometric_scope_review"
        classification = "fixed_geometry_not_stable_enough_for_local_smoke"
        reason = "The available fixed geometry is too weak to justify another local crop-normalization smoke."
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "upper_body_train_median_heldout_ok": upper_heldout_ok,
        "head_train_median_heldout_ok": head_heldout_ok,
        "not_a_detector0_runtime_objectness_claim": True,
    }


def main() -> int:
    args = parse_args()
    packet = read_json(args.packet.resolve())
    m3ea_receipt = read_json(args.m3ea_receipt.resolve())
    model_card = read_json(REFERENCE_PATHS["model_card"])
    active_vocabulary = read_json(REFERENCE_PATHS["active_vocabulary_claim"])
    boxes_by_target, packet_summary = load_target_boxes(packet)
    candidates = fixed_geometry_candidates(boxes_by_target)
    outcome = classify_outcome(candidates)

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3EB - Detector 0 fixed-geometric fallback",
        "active_prompt": "docs/model/return-to-form-detector0-fixed-geometric-fallback-goal-loop-prompt.md",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": COMMANDS_RUN,
        "commands_intentionally_not_run": [
            "No Brev worker creation, sync, SSH, remote compute, remote training, stop, delete, or reset.",
            "No training, fitting, optimizer construction, backward pass, checkpoint, model artifact, export, or promotion.",
            "No source import, media download, source-register mutation, manifest mutation, tensor mutation, vocabulary mutation, label expansion, or packet-row mutation.",
            "No recognizer retraining, browser activation, product runtime change, final readiness claim, ASL correctness claim, or push.",
        ],
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
            "m3ea_receipt": file_ref(args.m3ea_receipt.resolve()),
        },
        "files_changed": [
            "scripts/run_return_to_form_detector0_fixed_geometric_fallback.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "packet_evidence": packet_summary,
        "m3ea_crosscheck": m3ea_crosscheck(m3ea_receipt),
        "fixed_geometry_candidates": candidates,
        "recommended_fallback_policy": {
            "primary_roi": {
                "target_id": "upper_body_or_signing_space",
                "box_source": "train_median_box",
                "box_xyxy_norm": candidates["upper_body_or_signing_space"]["candidates"]["train_median_box"][
                    "box_xyxy_norm"
                ],
                "allowed_use": "transparent fixed crop/ROI fallback for local diagnostic crop-normalization smoke",
                "disallowed_use": "runtime Detector 0 objectness, hand localization, ASL correctness, browser activation, or product promotion",
            },
            "context_roi": {
                "target_id": "head_or_face",
                "box_source": "train_median_box",
                "box_xyxy_norm": candidates["head_or_face"]["candidates"]["train_median_box"]["box_xyxy_norm"],
                "allowed_use": "optional fixed context/normalization reference in a future local smoke",
                "disallowed_use": "landmark detection, face tracking claim, identity inference, or product runtime authority",
            },
            "hand_roi": {
                "target_id": "left_or_first_hand",
                "status": candidates["left_or_first_hand"]["assessment"]["status"],
                "allowed_use": "diagnostic coverage accounting only",
                "disallowed_use": "precise fixed hand detector or substitute for approved hand annotations",
            },
            "separation_from_detector0": (
                "The fallback is deterministic geometry derived from approved packet boxes. It has no learned "
                "objectness head, no negative specificity, no runtime detector artifact, and no threshold to promote."
            ),
        },
        "future_crop_normalization_smoke": {
            "justified": outcome["next_action"] == "prepare_fixed_geometric_crop_normalization_smoke_no_brev",
            "next_action": outcome["next_action"],
            "scope": (
                "A future no-Brev smoke may compare fixed upper-body/head ROI crop-normalization against existing "
                "fixed-crop evidence using repo-approved tensors/manifests, with fail-closed product claims unchanged."
            ),
            "must_not_claim": [
                "Detector 0 objectness is solved",
                "hand tracking or landmarks are available",
                "browser recognition can activate",
                "ASL correctness or final readiness",
            ],
            "still_requires_human_approval_for": [
                "packet-row mutation",
                "new annotation budget",
                "source import or source license approval",
                "Brev spend or remote training",
                "final gate changes or product promotion",
            ],
        },
        "claim_boundary": {
            "model_card_status": model_card.get("status"),
            "active_labels": active_vocabulary.get("activeLabels"),
            "browser_recognition": "unchanged_inactive",
            "detector0_runtime_artifact": "not_created",
            "model_artifact_saved": False,
            "fixed_geometry_is_product_authority": False,
            "final_readiness_claim": False,
            "asl_correctness_claim": False,
        },
        "boundaries": {
            "local_only": True,
            "read_only_packet_and_receipts": True,
            "training": False,
            "fitting": False,
            "optimizer_or_backward": False,
            "packet_mutation": False,
            "source_import": False,
            "manifest_mutation": False,
            "tensor_mutation": False,
            "vocabulary_mutation": False,
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
                "primary_roi": report["recommended_fallback_policy"]["primary_roi"]["box_xyxy_norm"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except FixedFallbackError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
