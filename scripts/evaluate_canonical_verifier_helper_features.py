#!/usr/bin/env python3
"""Evaluate a diagnostic canonical verifier over project-owned helper features."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FEATURE_SUMMARY = PROJECT_ROOT / "docs" / "validation" / "canonical-verifier-helper-features.json"
FEATURE_RECORDS = PROJECT_ROOT / "artifacts" / "rawframe-model-diagnostics" / "canonical-verifier-010" / "helper-features.json"
WRONG_PROMPT_CALIBRATION = PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "wrong_prompt_calibration.json"
WRONG_PROMPT_TEST = PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "wrong_prompt_test.json"
DEFAULT_REPORT = PROJECT_ROOT / "artifacts" / "rawframe-model-diagnostics" / "canonical-verifier-010" / "helper-template-verifier-report.json"

FEATURE_NAMES = [
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
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--wrong-prompt-false-pass-target", type=float, default=0.10)
    parser.add_argument("--hard-negative-false-pass-target", type=float, default=0.05)
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


def flatten_records(features: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for split, records in features["splits"].items():
        for record in records:
            rows.append({**record, "split": split})
    return rows


def vector(record: dict[str, Any], means: dict[str, float], stds: dict[str, float]) -> list[float]:
    features = record["features"]
    return [
        (float(features[name]) - means[name]) / stds[name]
        for name in FEATURE_NAMES
    ]


def distance(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right, strict=True)))


def min_template_distance(record: dict[str, Any], label_id: str, templates: dict[str, list[list[float]]], means: dict[str, float], stds: dict[str, float]) -> float:
    candidate = vector(record, means, stds)
    label_templates = templates[label_id]
    return min(distance(candidate, template) for template in label_templates)


def summarize_binary(total: int, accepted: int, correct_accepts: int | None = None) -> dict[str, Any]:
    row = {
        "examples": total,
        "accepted_count": accepted,
        "accept_rate": accepted / total if total else 0.0,
    }
    if correct_accepts is not None:
        row["correct_accept_count"] = correct_accepts
        row["true_accept_rate"] = correct_accepts / total if total else 0.0
    return row


def build_feature_scale(template_records: list[dict[str, Any]], calibration_records: list[dict[str, Any]]) -> tuple[dict[str, float], dict[str, float]]:
    source = [*template_records, *calibration_records]
    means = {}
    stds = {}
    for name in FEATURE_NAMES:
        values = [float(record["features"][name]) for record in source]
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / len(values)
        means[name] = mean
        stds[name] = max(math.sqrt(variance), 1e-6)
    return means, stds


def choose_thresholds(
    labels: list[str],
    templates: dict[str, list[list[float]]],
    means: dict[str, float],
    stds: dict[str, float],
    calibration_records: list[dict[str, Any]],
    wrong_prompt_pairs: list[dict[str, Any]],
    hard_negative_records: list[dict[str, Any]],
    wrong_prompt_target: float,
    hard_negative_target: float,
) -> tuple[dict[str, float], dict[str, Any]]:
    records_by_clip = {record["clip_id"]: record for record in calibration_records}
    thresholds = {}
    diagnostics = {}
    for label_id in labels:
        positive_distances = [
            min_template_distance(record, label_id, templates, means, stds)
            for record in calibration_records
            if record["label_id"] == label_id and record["features"]["quality_gate_passed"]
        ]
        wrong_distances = [
            min_template_distance(records_by_clip[pair["clip_id"]], label_id, templates, means, stds)
            for pair in wrong_prompt_pairs
            if pair["prompted_label_id"] == label_id and records_by_clip[pair["clip_id"]]["features"]["quality_gate_passed"]
        ]
        hard_distances = [
            min_template_distance(record, label_id, templates, means, stds)
            for record in hard_negative_records
            if record["features"]["quality_gate_passed"]
        ]
        candidates = sorted(set([*positive_distances, *wrong_distances, *hard_distances]))
        if not candidates:
            thresholds[label_id] = -1.0
            diagnostics[label_id] = {"eligible": False, "reason": "no candidate distances"}
            continue
        best_eligible = None
        best_tradeoff = None
        for threshold in candidates:
            true_accepts = sum(1 for value in positive_distances if value <= threshold)
            wrong_false = sum(1 for value in wrong_distances if value <= threshold)
            hard_false = sum(1 for value in hard_distances if value <= threshold)
            true_accept_rate = true_accepts / len(positive_distances) if positive_distances else 0.0
            wrong_false_rate = wrong_false / len(wrong_distances) if wrong_distances else 0.0
            hard_false_rate = hard_false / len(hard_distances) if hard_distances else 0.0
            row = {
                "threshold": threshold,
                "eligible": wrong_false_rate < wrong_prompt_target and hard_false_rate < hard_negative_target,
                "positive_count": len(positive_distances),
                "wrong_prompt_count": len(wrong_distances),
                "hard_negative_count": len(hard_distances),
                "true_accept_rate": true_accept_rate,
                "wrong_prompt_false_pass_rate": wrong_false_rate,
                "hard_negative_false_pass_rate": hard_false_rate,
            }
            if row["eligible"] and (
                best_eligible is None
                or (row["true_accept_rate"], -row["wrong_prompt_false_pass_rate"], -row["hard_negative_false_pass_rate"], row["threshold"])
                > (
                    best_eligible["true_accept_rate"],
                    -best_eligible["wrong_prompt_false_pass_rate"],
                    -best_eligible["hard_negative_false_pass_rate"],
                    best_eligible["threshold"],
                )
            ):
                best_eligible = row
            if best_tradeoff is None or (
                -row["hard_negative_false_pass_rate"],
                -row["wrong_prompt_false_pass_rate"],
                row["true_accept_rate"],
                row["threshold"],
            ) > (
                -best_tradeoff["hard_negative_false_pass_rate"],
                -best_tradeoff["wrong_prompt_false_pass_rate"],
                best_tradeoff["true_accept_rate"],
                best_tradeoff["threshold"],
            ):
                best_tradeoff = row
        selected = best_eligible or best_tradeoff
        thresholds[label_id] = float(selected["threshold"])
        diagnostics[label_id] = {
            **selected,
            "selection_rule": "max_true_accept_under_calibration_false_pass_targets" if best_eligible else "fallback_lowest_calibration_false_pass_tradeoff",
        }
    return thresholds, diagnostics


def score_positive(records: list[dict[str, Any]], labels: list[str], templates: dict[str, list[list[float]]], thresholds: dict[str, float], means: dict[str, float], stds: dict[str, float]) -> dict[str, Any]:
    total = 0
    true_accepts = 0
    by_label = {}
    for record in records:
        label_id = record["label_id"]
        if label_id not in labels:
            continue
        total += 1
        accepted = record["features"]["quality_gate_passed"] and min_template_distance(record, label_id, templates, means, stds) <= thresholds[label_id]
        true_accepts += 1 if accepted else 0
        row = by_label.setdefault(label_id, {"examples": 0, "true_accept_count": 0})
        row["examples"] += 1
        row["true_accept_count"] += 1 if accepted else 0
    for row in by_label.values():
        row["true_accept_rate"] = row["true_accept_count"] / row["examples"] if row["examples"] else 0.0
    return {**summarize_binary(total, true_accepts, true_accepts), "by_label": by_label}


def score_wrong_prompts(pairs: list[dict[str, Any]], records_by_clip: dict[str, dict[str, Any]], templates: dict[str, list[list[float]]], thresholds: dict[str, float], means: dict[str, float], stds: dict[str, float]) -> dict[str, Any]:
    false_passes = 0
    by_prompt = {}
    for pair in pairs:
        record = records_by_clip[pair["clip_id"]]
        prompt = pair["prompted_label_id"]
        accepted = record["features"]["quality_gate_passed"] and min_template_distance(record, prompt, templates, means, stds) <= thresholds[prompt]
        false_passes += 1 if accepted else 0
        row = by_prompt.setdefault(prompt, {"examples": 0, "false_pass_count": 0})
        row["examples"] += 1
        row["false_pass_count"] += 1 if accepted else 0
    for row in by_prompt.values():
        row["false_pass_rate"] = row["false_pass_count"] / row["examples"] if row["examples"] else 0.0
    return {
        "examples": len(pairs),
        "false_pass_count": false_passes,
        "false_pass_rate": false_passes / len(pairs) if pairs else 0.0,
        "by_prompt_label": by_prompt,
    }


def score_hard_negatives(records: list[dict[str, Any]], labels: list[str], templates: dict[str, list[list[float]]], thresholds: dict[str, float], means: dict[str, float], stds: dict[str, float]) -> dict[str, Any]:
    false_passes = 0
    quality_rejected = 0
    for record in records:
        if not record["features"]["quality_gate_passed"]:
            quality_rejected += 1
            continue
        accepted = any(
            min_template_distance(record, label_id, templates, means, stds) <= thresholds[label_id]
            for label_id in labels
        )
        false_passes += 1 if accepted else 0
    return {
        "examples": len(records),
        "false_pass_count": false_passes,
        "quality_gate_reject_count": quality_rejected,
        "false_pass_rate": false_passes / len(records) if records else 0.0,
    }


def main() -> int:
    args = parse_args()
    summary = read_json(FEATURE_SUMMARY)
    features = read_json(FEATURE_RECORDS)
    split_records = features["splits"]
    templates_records = split_records["templates"]
    calibration_records = split_records["calibration"]
    test_records = split_records["test"]
    hard_calibration_records = split_records["hard_negative_calibration"]
    hard_test_records = split_records["hard_negative_test"]
    core_negative_records = split_records["core_negative_challenge"]
    labels = sorted({record["label_id"] for record in templates_records if record.get("label_id")})
    means, stds = build_feature_scale(templates_records, calibration_records)
    templates = {
        label_id: [
            vector(record, means, stds)
            for record in templates_records
            if record["label_id"] == label_id and record["features"]["quality_gate_passed"]
        ]
        for label_id in labels
    }
    wrong_calibration = read_json(WRONG_PROMPT_CALIBRATION)["pairs"]
    wrong_test = read_json(WRONG_PROMPT_TEST)["pairs"]
    thresholds, threshold_diagnostics = choose_thresholds(
        labels,
        templates,
        means,
        stds,
        calibration_records,
        wrong_calibration,
        hard_calibration_records,
        args.wrong_prompt_false_pass_target,
        args.hard_negative_false_pass_target,
    )
    calibration_by_clip = {record["clip_id"]: record for record in calibration_records}
    test_by_clip = {record["clip_id"]: record for record in test_records}
    calibration_positive = score_positive(calibration_records, labels, templates, thresholds, means, stds)
    test_positive = score_positive(test_records, labels, templates, thresholds, means, stds)
    calibration_wrong = score_wrong_prompts(wrong_calibration, calibration_by_clip, templates, thresholds, means, stds)
    test_wrong = score_wrong_prompts(wrong_test, test_by_clip, templates, thresholds, means, stds)
    calibration_hard = score_hard_negatives(hard_calibration_records, labels, templates, thresholds, means, stds)
    test_hard = score_hard_negatives(hard_test_records, labels, templates, thresholds, means, stds)
    core_negative = score_hard_negatives(core_negative_records, labels, templates, thresholds, means, stds)
    test_tnr = ((1.0 - test_wrong["false_pass_rate"]) + (1.0 - test_hard["false_pass_rate"])) / 2
    test_balanced_accuracy = (test_positive["true_accept_rate"] + test_tnr) / 2
    pass_status = {
        "balanced_accuracy": test_balanced_accuracy >= 0.70,
        "true_accept_rate": test_positive["true_accept_rate"] >= 0.70,
        "wrong_prompt_false_pass_rate": test_wrong["false_pass_rate"] < args.wrong_prompt_false_pass_target,
        "hard_negative_false_pass_rate": test_hard["false_pass_rate"] < args.hard_negative_false_pass_target,
    }
    report = {
        "schema_version": "asl-pilot-canonical-helper-template-verifier/v1",
        "status": "diagnostic_failed" if not all(pass_status.values()) else "diagnostic_passed_not_promotable",
        "finality": "diagnostic_not_browser_promotable_model_evidence",
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": file_reference(Path(__file__).resolve()),
            "command": ["python", *[str(arg) for arg in __import__("sys").argv]],
        },
        "inputs": {
            "feature_summary": file_reference(FEATURE_SUMMARY),
            "feature_records": file_reference(FEATURE_RECORDS),
            "wrong_prompt_calibration": file_reference(WRONG_PROMPT_CALIBRATION),
            "wrong_prompt_test": file_reference(WRONG_PROMPT_TEST),
        },
        "method": {
            "name": "canonical_helper_feature_template_distance",
            "pretrained_components": [],
            "landmark_components": [],
            "detector_components": [],
            "sign_classifier_components": [],
            "feature_names": FEATURE_NAMES,
            "template_source": "canonical templates split",
            "threshold_source": "calibration positives plus calibration wrong-prompt and hard-negative clips only",
            "decision": "accept prompted label when helper quality gate passes and standardized helper-feature distance to a same-label template is below the label threshold",
        },
        "labels": labels,
        "thresholds": thresholds,
        "threshold_diagnostics": threshold_diagnostics,
        "calibration": {
            "positive": calibration_positive,
            "wrong_prompt": calibration_wrong,
            "hard_negative": calibration_hard,
        },
        "test": {
            "positive": test_positive,
            "wrong_prompt": test_wrong,
            "hard_negative": test_hard,
            "true_negative_rate": test_tnr,
            "balanced_accuracy": test_balanced_accuracy,
        },
        "core_negative_challenge": core_negative,
        "targets": {
            "balanced_accuracy": 0.70,
            "true_accept_rate": 0.70,
            "wrong_prompt_false_pass_below": args.wrong_prompt_false_pass_target,
            "hard_negative_false_pass_below": args.hard_negative_false_pass_target,
        },
        "pass_status": pass_status,
        "known_limitations": [
            "Uses coarse raw motion/quality helper features, not hand/face/torso geometry.",
            "No first-party clips are included.",
            "This diagnostic does not produce a browser model, model card promotion, or validated sign set.",
        ],
        "helper_feature_summary": summary,
    }
    write_json(args.output_report, report)
    print(json.dumps({
        "status": report["status"],
        "output_report": project_relative(args.output_report),
        "output_report_sha256": sha256_file(args.output_report),
        "test_balanced_accuracy": test_balanced_accuracy,
        "test_true_accept_rate": test_positive["true_accept_rate"],
        "test_wrong_prompt_false_pass_rate": test_wrong["false_pass_rate"],
        "test_hard_negative_false_pass_rate": test_hard["false_pass_rate"],
        "core_negative_false_pass_rate": core_negative["false_pass_rate"],
        "pass_status": pass_status,
    }, indent=2, sort_keys=True))
    return 0 if all(pass_status.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
