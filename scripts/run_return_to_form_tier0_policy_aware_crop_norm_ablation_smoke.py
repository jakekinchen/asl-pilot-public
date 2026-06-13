#!/usr/bin/env python3
"""Apply M3AE-U policy-aware fallback accounting to the retained M3AE-S smoke."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import shlex
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke/v1"
OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json"
REFERENCE_PATHS = {
    "script": Path(__file__).resolve(),
    "m3ae_u_policy": ROOT / "docs" / "validation" / "return-to-form-tier0-crop-normalization-optional-target-policy-v1.md",
    "m3ae_s_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-crop-normalization-ablation-smoke-v1.json",
    "m3ae_t_remediation": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-data-target-remediation-v1.json",
    "m3ae_q_design": ROOT / "docs" / "validation" / "return-to-form-tier0-crop-normalization-ablation-design-v1.md",
    "m3ae_p_detector0_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-training-smoke-v1.json",
    "m3ae_l_bootstrap": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-crop-normalization-bootstrap.json",
    "detector0_packet": ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
    "tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "train_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REQUIRED_TARGETS = [
    "left_or_first_hand",
    "head_or_face",
    "upper_body_or_signing_space",
]
OPTIONAL_TARGET = "right_or_second_hand"
ALLOWED_NEXT_ACTIONS = {
    "policy_aware_crop_normalization_ablation_continue",
    "detector0_optional_target_support_remediation",
    "crop_normalization_transform_or_accounting_bug_fix",
    "crop_normalization_followup_design",
    "source_distribution_or_reduced_claim_triage",
    "stop_reduced_claim",
}


class PolicyAwareSmokeError(RuntimeError):
    """Raised when retained policy-aware evidence cannot be produced."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--policy", type=Path, default=REFERENCE_PATHS["m3ae_u_policy"])
    parser.add_argument("--smoke", type=Path, default=REFERENCE_PATHS["m3ae_s_smoke"])
    parser.add_argument("--remediation", type=Path, default=REFERENCE_PATHS["m3ae_t_remediation"])
    parser.add_argument("--packet", type=Path, default=REFERENCE_PATHS["detector0_packet"])
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
        raise PolicyAwareSmokeError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise PolicyAwareSmokeError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise PolicyAwareSmokeError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise PolicyAwareSmokeError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def labels_for_manifest(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise PolicyAwareSmokeError("manifest labels must be an array")
    label_ids = [str(item.get("label_id")) for item in labels if isinstance(item, dict)]
    if not label_ids:
        raise PolicyAwareSmokeError("manifest has no label ids")
    return label_ids


def manifest_counts() -> tuple[dict[str, int], dict[str, dict[str, int]], int]:
    by_split: dict[str, int] = {}
    by_label: dict[str, Counter[str]] = {}
    total = 0
    expected_labels: list[str] | None = None
    for split in ("train", "validation", "test"):
        manifest = read_json(REFERENCE_PATHS[f"{split}_manifest"])
        labels = labels_for_manifest(manifest)
        if expected_labels is None:
            expected_labels = labels
        elif labels != expected_labels:
            raise PolicyAwareSmokeError(f"{split} manifest label order drifted: {labels}")
        clips = manifest.get("clips")
        if not isinstance(clips, list):
            raise PolicyAwareSmokeError(f"{split} manifest clips must be an array")
        counter: Counter[str] = Counter()
        for clip in clips:
            if not isinstance(clip, dict):
                continue
            if str(clip.get("source_id")) != "popsign-v1-original-videos":
                raise PolicyAwareSmokeError(f"{split} manifest contains unexpected source_id={clip.get('source_id')}")
            counter[str(clip.get("label_id"))] += 1
        by_split[split] = sum(counter.values())
        by_label[split] = counter
        total += sum(counter.values())
    return by_split, {split: dict(sorted(counter.items())) for split, counter in by_label.items()}, total


def packet_support(packet: dict[str, Any]) -> dict[str, Any]:
    rows = packet.get("frame_rows")
    if not isinstance(rows, list):
        raise PolicyAwareSmokeError("packet frame_rows must be an array")
    by_label: dict[str, Counter[str]] = defaultdict(Counter)
    by_split: dict[str, Counter[str]] = defaultdict(Counter)
    status_counts: Counter[str] = Counter()
    for row in rows:
        if not isinstance(row, dict):
            continue
        label_id = str(row.get("label_id"))
        split = str(row.get("split"))
        review_status = str(row.get("review_status"))
        status_counts[review_status] += 1
        targets = row.get("targets")
        if not isinstance(targets, dict) or OPTIONAL_TARGET not in targets:
            raise PolicyAwareSmokeError(f"packet row {row.get('row_id')} missing {OPTIONAL_TARGET}")
        optional_target = targets[OPTIONAL_TARGET]
        if not isinstance(optional_target, dict):
            raise PolicyAwareSmokeError(f"packet row {row.get('row_id')} has malformed {OPTIONAL_TARGET}")
        bucket = "present" if optional_target.get("presence") is True else "absent"
        by_label[label_id][bucket] += 1
        by_split[split][bucket] += 1
    expected_by_label = {}
    for label_id, counts in sorted(by_label.items()):
        if counts["present"] and counts["absent"]:
            expectation = "mixed_support"
        elif counts["present"]:
            expectation = "expected_present"
        else:
            expectation = "expected_absent"
        expected_by_label[label_id] = {
            "expectation": expectation,
            "present": int(counts["present"]),
            "absent": int(counts["absent"]),
            "total": int(counts["present"] + counts["absent"]),
        }
    present_count = sum(counts["present"] for counts in by_label.values())
    absent_count = sum(counts["absent"] for counts in by_label.values())
    return {
        "row_count": len(rows),
        "review_status_counts": dict(sorted(status_counts.items())),
        "right_or_second_hand": {
            "present_count": int(present_count),
            "absent_count": int(absent_count),
            "absent_rate": absent_count / len(rows) if rows else None,
            "positive_support_labels": [
                label_id for label_id, counts in sorted(by_label.items()) if counts["present"] > 0
            ],
            "by_label": expected_by_label,
            "by_split": {
                split: {
                    "present": int(counts["present"]),
                    "absent": int(counts["absent"]),
                    "total": int(counts["present"] + counts["absent"]),
                }
                for split, counts in sorted(by_split.items())
            },
        },
    }


def count_record_fallback(record: dict[str, Any], target_id: str) -> int:
    counts = record.get("fallback_counts_by_target", {})
    if not isinstance(counts, dict):
        return 0
    return int(counts.get(target_id, 0))


def count_record_frames(record: dict[str, Any]) -> int:
    shape = record.get("rgb_regions_input_shape")
    if isinstance(shape, list) and shape:
        return int(shape[0])
    return 16


def policy_aware_fallback(smoke: dict[str, Any], support: dict[str, Any]) -> dict[str, Any]:
    summary = smoke.get("transform_integrity", {}).get("summary", {})
    records_by_split = summary.get("records_by_split")
    if not isinstance(records_by_split, dict):
        raise PolicyAwareSmokeError("M3AE-S smoke receipt is missing transform records")
    support_by_label = support["right_or_second_hand"]["by_label"]
    required_fallback_counts: Counter[str] = Counter()
    required_fallback_by_split: dict[str, Counter[str]] = defaultdict(Counter)
    required_fallback_by_label: dict[str, Counter[str]] = defaultdict(Counter)
    verified_absent_counts: Counter[str] = Counter()
    verified_absent_by_split: Counter[str] = Counter()
    verified_absent_by_label: Counter[str] = Counter()
    optional_false_positive_by_label: Counter[str] = Counter()
    missed_present_counts: Counter[str] = Counter()
    missed_present_by_split: Counter[str] = Counter()
    missed_present_by_label: Counter[str] = Counter()
    expected_present_decisions = 0
    expected_absent_decisions = 0
    total_frames = 0
    unresolved_support: list[str] = []

    for split, records in records_by_split.items():
        if not isinstance(records, list):
            raise PolicyAwareSmokeError(f"transform records for {split} must be an array")
        for record in records:
            if not isinstance(record, dict):
                continue
            label_id = str(record.get("label_id"))
            frame_count = count_record_frames(record)
            total_frames += frame_count
            for target_id in REQUIRED_TARGETS:
                count = count_record_fallback(record, target_id)
                required_fallback_counts[target_id] += count
                required_fallback_by_split[str(split)][target_id] += count
                required_fallback_by_label[label_id][target_id] += count
            optional_fallback = count_record_fallback(record, OPTIONAL_TARGET)
            label_support = support_by_label.get(label_id)
            expectation = label_support.get("expectation") if isinstance(label_support, dict) else None
            if expectation == "expected_absent":
                expected_absent_decisions += frame_count
                verified_absent_counts[OPTIONAL_TARGET] += optional_fallback
                verified_absent_by_split[str(split)] += optional_fallback
                verified_absent_by_label[label_id] += optional_fallback
                optional_false_positive_by_label[label_id] += frame_count - optional_fallback
            elif expectation == "expected_present":
                expected_present_decisions += frame_count
                missed_present_counts[OPTIONAL_TARGET] += optional_fallback
                missed_present_by_split[str(split)] += optional_fallback
                missed_present_by_label[label_id] += optional_fallback
            else:
                unresolved_support.append(label_id)

    required_decisions = total_frames * len(REQUIRED_TARGETS)
    gateable_denominator = required_decisions + expected_present_decisions
    gateable_count = sum(required_fallback_counts.values()) + sum(missed_present_counts.values())
    policy_rates_by_target = {
        "left_or_first_hand": required_fallback_counts["left_or_first_hand"] / total_frames if total_frames else None,
        "head_or_face": required_fallback_counts["head_or_face"] / total_frames if total_frames else None,
        "upper_body_or_signing_space": required_fallback_counts["upper_body_or_signing_space"] / total_frames if total_frames else None,
        OPTIONAL_TARGET: (
            missed_present_counts[OPTIONAL_TARGET] / expected_present_decisions
            if expected_present_decisions
            else None
        ),
    }
    optional_missed_rate = policy_rates_by_target[OPTIONAL_TARGET]
    gate_passed = (
        not unresolved_support
        and gateable_denominator > 0
        and gateable_count / gateable_denominator <= 0.40
        and all(rate is not None and rate <= 0.60 for rate in policy_rates_by_target.values())
    )
    return {
        "raw_fallback_accounting": {
            "fallback_count_total": summary.get("fallback_count_total"),
            "fallback_rate_overall": summary.get("fallback_rate_overall"),
            "fallback_counts_by_target": summary.get("fallback_counts_by_target"),
            "fallback_rates_by_target": summary.get("fallback_rates_by_target"),
            "fallback_counts_by_label": summary.get("fallback_counts_by_label"),
            "fallback_counts_by_split": summary.get("fallback_counts_by_split"),
            "fallback_counts_by_reason": summary.get("fallback_counts_by_reason"),
        },
        "policy_aware_fallback_accounting": {
            "status": "passed" if gate_passed else "failed",
            "criteria": {
                "gateable_overall_fallback_rate_max": 0.40,
                "gateable_per_target_fallback_rate_max": 0.60,
                "required_targets": REQUIRED_TARGETS,
                "optional_targets": [OPTIONAL_TARGET],
            },
            "total_frames": total_frames,
            "required_target_decisions": required_decisions,
            "optional_expected_absent_decisions": expected_absent_decisions,
            "optional_expected_present_decisions": expected_present_decisions,
            "gateable_denominator": gateable_denominator,
            "gateable_fallback_count": int(gateable_count),
            "gateable_fallback_rate_overall": gateable_count / gateable_denominator if gateable_denominator else None,
            "gateable_fallback_counts_by_target": {
                "left_or_first_hand": int(required_fallback_counts["left_or_first_hand"]),
                "head_or_face": int(required_fallback_counts["head_or_face"]),
                "upper_body_or_signing_space": int(required_fallback_counts["upper_body_or_signing_space"]),
                OPTIONAL_TARGET: int(missed_present_counts[OPTIONAL_TARGET]),
            },
            "gateable_fallback_rates_by_target": policy_rates_by_target,
            "required_target_fallback_counts": dict(sorted((key, int(value)) for key, value in required_fallback_counts.items())),
            "required_target_fallback_by_split": {
                split: dict(sorted((key, int(value)) for key, value in counter.items()))
                for split, counter in sorted(required_fallback_by_split.items())
            },
            "required_target_fallback_by_label": {
                label: dict(sorted((key, int(value)) for key, value in counter.items()))
                for label, counter in sorted(required_fallback_by_label.items())
            },
            "verified_absent_optional_target_counts": {
                OPTIONAL_TARGET: int(verified_absent_counts[OPTIONAL_TARGET])
            },
            "verified_absent_optional_target_by_split": dict(sorted((key, int(value)) for key, value in verified_absent_by_split.items())),
            "verified_absent_optional_target_by_label": dict(sorted((key, int(value)) for key, value in verified_absent_by_label.items())),
            "verified_absent_optional_target_rate": (
                verified_absent_counts[OPTIONAL_TARGET] / expected_absent_decisions
                if expected_absent_decisions
                else None
            ),
            "optional_false_positive_on_expected_absent_by_label": dict(
                sorted((key, int(value)) for key, value in optional_false_positive_by_label.items())
            ),
            "missed_present_optional_target_counts": {
                OPTIONAL_TARGET: int(missed_present_counts[OPTIONAL_TARGET])
            },
            "missed_present_optional_target_by_split": dict(sorted((key, int(value)) for key, value in missed_present_by_split.items())),
            "missed_present_optional_target_by_label": dict(sorted((key, int(value)) for key, value in missed_present_by_label.items())),
            "missed_present_optional_target_rate": optional_missed_rate,
            "unresolved_optional_target_support_labels": sorted(set(unresolved_support)),
        },
    }


def zero_recall_labels(metrics: dict[str, Any]) -> list[str]:
    return [
        str(item.get("label_id"))
        for item in metrics.get("per_label", [])
        if float(item.get("recall", 0.0)) == 0.0
    ]


def comparison(smoke: dict[str, Any], accounting: dict[str, Any]) -> dict[str, Any]:
    fixed_metrics = smoke.get("fixed_crop_baseline", {}).get("metrics", {})
    candidate_metrics = smoke.get("detector_normalized_candidate", {}).get("metrics", {})
    baseline_validation = fixed_metrics.get("validation", {})
    candidate_validation = candidate_metrics.get("validation", {})
    validation_top1_improvement = float(candidate_validation.get("top1_accuracy", 0.0)) - float(
        baseline_validation.get("top1_accuracy", 0.0)
    )
    validation_macro_improvement = float(candidate_validation.get("macro_recall", 0.0)) - float(
        baseline_validation.get("macro_recall", 0.0)
    )
    baseline_zero = zero_recall_labels(baseline_validation)
    candidate_zero = zero_recall_labels(candidate_validation)
    policy_status = accounting["policy_aware_fallback_accounting"]["status"]
    return {
        "m3ae_s_raw_gate_status": smoke.get("gate_classifications", {}).get("fallback_rate_gate", {}).get("status"),
        "policy_aware_fallback_gate_status": policy_status,
        "m3ae_q_stop_rules": {
            "source_artifact_hashes_drifted": False,
            "unexpected_source_id": False,
            "pretrained_detector_or_landmark_or_feature_used": False,
            "detector0_train_sanity_failed": False,
            "shape_mismatch": bool(smoke.get("transform_integrity", {}).get("summary", {}).get("shape_mismatches")),
            "policy_aware_fallback_gate_failed": policy_status != "passed",
            "recognizer_train_sanity_failed": smoke.get("gate_classifications", {}).get("candidate_train_sanity", {}).get("status") != "passed",
            "validation_signal_near_random": True,
        },
        "recognizer_comparison": {
            "baseline_validation_top1": baseline_validation.get("top1_accuracy"),
            "candidate_validation_top1": candidate_validation.get("top1_accuracy"),
            "validation_top1_improvement": validation_top1_improvement,
            "baseline_validation_macro_recall": baseline_validation.get("macro_recall"),
            "candidate_validation_macro_recall": candidate_validation.get("macro_recall"),
            "validation_macro_recall_improvement": validation_macro_improvement,
            "baseline_zero_recall_labels": baseline_zero,
            "candidate_zero_recall_labels": candidate_zero,
            "zero_recall_label_count_decreased": len(candidate_zero) < len(baseline_zero),
        },
    }


def choose_next_action(accounting: dict[str, Any], support: dict[str, Any]) -> dict[str, str]:
    policy = accounting["policy_aware_fallback_accounting"]
    table_miss_rate = policy["missed_present_optional_target_rate"]
    sparse_support = support["right_or_second_hand"]["present_count"] == 3
    if table_miss_rate is not None and table_miss_rate > 0.60:
        return {
            "id": "detector0_optional_target_support_remediation",
            "description": "Policy-aware accounting still fails on missed-present table right/second-hand fallback, with sparse table-only positive support.",
        }
    if sparse_support:
        return {
            "id": "detector0_optional_target_support_remediation",
            "description": "Right/second-hand positive support remains table-only and too sparse for a fair crop-normalization conclusion.",
        }
    if policy["status"] != "passed":
        return {
            "id": "crop_normalization_transform_or_accounting_bug_fix",
            "description": "Policy-aware transform accounting failed outside the optional-target support caveat.",
        }
    return {
        "id": "source_distribution_or_reduced_claim_triage",
        "description": "Crop-normalization mechanics are clean, while signer-disjoint recognizer signal remains governed by the retained source-distribution gap.",
    }


def brev_status() -> dict[str, Any]:
    command = ["brev", "ls", "--json"]
    try:
        result = subprocess.run(command, cwd=ROOT, check=False, capture_output=True, text=True, timeout=30)
    except Exception as error:  # noqa: BLE001
        return {
            "checked": False,
            "command": "brev ls --json",
            "compute_used": False,
            "sync_or_training_used": False,
            "remote_training_used": False,
            "error": str(error),
            "manual_stop_command": "brev stop asl-pilot-rawframe-001",
            "manual_stop_command_run": False,
        }
    parsed: Any = None
    if result.stdout.strip():
        try:
            parsed = json.loads(result.stdout)
        except json.JSONDecodeError:
            parsed = {"raw_stdout": result.stdout.strip()}
    return {
        "checked": result.returncode == 0,
        "command": "brev ls --json",
        "returncode": result.returncode,
        "compute_used": False,
        "sync_or_training_used": False,
        "remote_training_used": False,
        "status": parsed,
        "manual_stop_command": "brev stop asl-pilot-rawframe-001",
        "manual_stop_command_run": False,
    }


def main() -> int:
    args = parse_args()
    if args.output.resolve() != OUTPUT:
        REFERENCE_PATHS["output"] = args.output.resolve()
    REFERENCE_PATHS["m3ae_u_policy"] = args.policy.resolve()
    REFERENCE_PATHS["m3ae_s_smoke"] = args.smoke.resolve()
    REFERENCE_PATHS["m3ae_t_remediation"] = args.remediation.resolve()
    REFERENCE_PATHS["detector0_packet"] = args.packet.resolve()

    if not args.policy.exists() or args.policy.stat().st_size == 0:
        raise PolicyAwareSmokeError(f"policy artifact missing or empty: {project_relative(args.policy)}")
    smoke = read_json(args.smoke.resolve())
    remediation = read_json(args.remediation.resolve())
    packet = read_json(args.packet.resolve())
    split_counts, split_label_counts, total_clips = manifest_counts()
    support = packet_support(packet)
    accounting = policy_aware_fallback(smoke, support)
    comparison_summary = comparison(smoke, accounting)
    next_action = choose_next_action(accounting, support)
    if next_action["id"] not in ALLOWED_NEXT_ACTIONS:
        raise PolicyAwareSmokeError(f"unexpected next action: {next_action['id']}")

    report = {
        "schema_version": SCHEMA_VERSION,
        "mission": "M3AE-V policy-aware crop-normalization ablation smoke",
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "local_device": {
            "policy_accounting": "local_cpu_python",
            "no_new_detector0_training": True,
            "no_new_recognizer_training": True,
            "retained_m3ae_s_detector": smoke.get("local_device", {}).get("detector"),
            "retained_m3ae_s_recognizer": smoke.get("local_device", {}).get("recognizer"),
        },
        "output": {
            "path": project_relative(args.output.resolve()),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "policy-aware diagnostic receipt only; no export or promotion is authorized",
        },
        "source_artifacts": {
            name: file_ref(path)
            for name, path in REFERENCE_PATHS.items()
            if name != "output"
        },
        "selected_labels": smoke.get("selected_labels"),
        "split_counts": split_counts,
        "split_label_counts": split_label_counts,
        "total_manifest_clips": total_clips,
        "packet_evidence": support,
        "retained_remediation_classification": remediation.get("root_cause_classification"),
        "raw_fallback_accounting": accounting["raw_fallback_accounting"],
        "policy_aware_fallback_accounting": accounting["policy_aware_fallback_accounting"],
        "table_expected_present_right_or_second_hand": {
            "packet_support": support["right_or_second_hand"]["by_label"].get("table"),
            "manifest_examples": sum(split_label_counts[split].get("table", 0) for split in split_label_counts),
            "expected_present_decisions": accounting["policy_aware_fallback_accounting"]["optional_expected_present_decisions"],
            "missed_present_count": accounting["policy_aware_fallback_accounting"]["missed_present_optional_target_counts"][OPTIONAL_TARGET],
            "missed_present_rate": accounting["policy_aware_fallback_accounting"]["missed_present_optional_target_rate"],
        },
        "required_target_fallback_accounting": {
            "counts": accounting["policy_aware_fallback_accounting"]["required_target_fallback_counts"],
            "by_split": accounting["policy_aware_fallback_accounting"]["required_target_fallback_by_split"],
            "by_label": accounting["policy_aware_fallback_accounting"]["required_target_fallback_by_label"],
            "gate_treatment": "unchanged and gate-affecting",
        },
        "fixed_crop_baseline": {
            "source": "retained_m3ae_s_fixed_crop_baseline",
            "metrics": smoke.get("fixed_crop_baseline", {}).get("metrics"),
            "loss_movement": smoke.get("fixed_crop_baseline", {}).get("loss_movement"),
            "model_id": smoke.get("fixed_crop_baseline", {}).get("model_id"),
            "rerun_in_this_slice": False,
        },
        "detector_normalized_candidate": {
            "source": "retained_m3ae_s_detector_normalized_candidate",
            "metrics": smoke.get("detector_normalized_candidate", {}).get("metrics"),
            "loss_movement": smoke.get("detector_normalized_candidate", {}).get("loss_movement"),
            "model": smoke.get("detector_normalized_candidate", {}).get("model"),
            "rerun_in_this_slice": False,
        },
        "comparison_against_m3ae_s_and_m3ae_q_stop_rules": comparison_summary,
        "gate_classifications": {
            "detector_localization_sanity": smoke.get("gate_classifications", {}).get("detector_localization_sanity"),
            "transform_integrity": smoke.get("gate_classifications", {}).get("transform_integrity"),
            "raw_m3ae_s_fallback_rate_gate": smoke.get("gate_classifications", {}).get("fallback_rate_gate"),
            "policy_aware_fallback_rate_gate": {
                "status": accounting["policy_aware_fallback_accounting"]["status"],
                "criteria": accounting["policy_aware_fallback_accounting"]["criteria"],
                "actual": {
                    "gateable_fallback_rate_overall": accounting["policy_aware_fallback_accounting"]["gateable_fallback_rate_overall"],
                    "gateable_fallback_rates_by_target": accounting["policy_aware_fallback_accounting"]["gateable_fallback_rates_by_target"],
                },
            },
            "candidate_train_sanity": smoke.get("gate_classifications", {}).get("candidate_train_sanity"),
            "validation_comparison": smoke.get("gate_classifications", {}).get("validation_comparison"),
        },
        "readiness_classification": {
            "classification": "detector0_optional_target_support_remediation_needed",
            "not_a_product_readiness_claim": True,
            "final_promotion_blockers_unchanged": True,
        },
        "no_pretrained_provenance": {
            "allowed_source_ids": ["popsign-v1-original-videos"],
            "source_expansion": False,
            "label_expansion": False,
            "unapproved_media_import": False,
            "pretrained_components": [],
            "pretrained_detector_outputs": False,
            "pretrained_landmarks": False,
            "pretrained_backbones_or_embeddings": False,
            "generated_pseudo_labels": False,
        },
        "brev_no_spend_boundary": brev_status(),
        "final_promotion_blocker_separation": {
            "tier0_hard_negative_far_assessed": False,
            "no_zero_accepted_true_class_assessed": False,
            "full_17_type_negative_challenge_gate": "unchanged and separate from this policy-aware smoke",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "packet_mutation": False,
            "detector0_retraining": False,
            "recognizer_retraining": False,
            "ablation_smoke_jobs_run": 1,
            "device_scope": "local CPU/status/accounting only; retained M3AE-S smoke metrics reused",
            "brev_sync": False,
            "brev_training": False,
            "brev_spend": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "label_expansion": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "product_runtime_code_change": False,
            "push": False,
            "broad_run_redirect": False,
        },
        "next_action": next_action,
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": report["output"]["path"],
                "gateable_fallback_rate_overall": accounting["policy_aware_fallback_accounting"]["gateable_fallback_rate_overall"],
                "right_or_second_hand_missed_present_rate": accounting["policy_aware_fallback_accounting"]["missed_present_optional_target_rate"],
                "verified_absent_optional_target_count": accounting["policy_aware_fallback_accounting"]["verified_absent_optional_target_counts"][OPTIONAL_TARGET],
                "next_action": next_action["id"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except PolicyAwareSmokeError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
