#!/usr/bin/env python3
"""Run the M3FR local strict-gate Detector 0 crop-normalization smoke."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import subprocess
import sys
from collections import Counter
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import (
    DEFAULT_PACKET,
    ROOT,
    UNION_TARGET_ID,
    Detector0SmokeError,
    file_ref,
    project_relative,
    read_json,
    write_json,
)
from run_return_to_form_tier0_detector0_union_target_architecture_microprobe import (
    load_architecture_dataset,
)
from run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2 import (
    train_microprobe,
)
from train_rawframe_model import TrainingError, import_torch


SCHEMA_VERSION = "asl-pilot-return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev/v1"
ACTIVE_PROMPT = "docs/model/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-goal-loop-prompt.md"
CONTRACT_PATH = ROOT / "docs" / "model" / "return-to-form-detector0-strict-gate-crop-normalization-contract.json"
M3FQ_RECEIPT_PATH = (
    ROOT / "docs" / "validation" / "return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json"
)
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json"
)
SESSION_LOG_PATH = ROOT / "docs" / "session-logs" / "594-mission-3fr-detector0-strict-gate-local-smoke-no-brev.md"
MODEL_CARD_PATH = ROOT / "web" / "public" / "model" / "model-card.json"
DETECTOR_CARD_PATH = ROOT / "web" / "public" / "model" / "detector0-card.json"
ACTIVE_VOCABULARY_PATH = ROOT / "docs" / "model" / "active-vocabulary-claim.json"

FIXED_GEOMETRY_TARGETS = [
    "left_or_first_hand",
    "head_or_face",
    "upper_body_or_signing_space",
]
LEARNED_RUNTIME_TARGETS = ["right_or_second_hand"]
DIAGNOSTIC_TARGETS = [UNION_TARGET_ID]
ALLOWED_NEXT_ACTIONS = {
    "continue_detector0_strict_gate_metric_triage_no_brev",
    "continue_detector0_strict_gate_contract_repair_no_brev",
    "continue_fail_closed_interactive_product_hardening",
    "continue_openai_or_gpt_pro_research",
    "stop_for_human_budget_or_claim_review",
}
REFERENCE_PATHS = {
    "active_prompt": ROOT / ACTIVE_PROMPT,
    "contract": CONTRACT_PATH,
    "m3fq_receipt": M3FQ_RECEIPT_PATH,
    "m3fq_session_log": ROOT / "docs" / "session-logs" / "592-mission-3fq-detector0-crop-normalized-recognizer-integration.md",
    "packet": DEFAULT_PACKET,
    "train_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
    "model_card": MODEL_CARD_PATH,
    "detector0_card": DETECTOR_CARD_PATH,
    "active_vocabulary_claim": ACTIVE_VOCABULARY_PATH,
    "runner": Path(__file__).resolve(),
    "architecture_dataset_helper": ROOT
    / "scripts"
    / "run_return_to_form_tier0_detector0_union_target_architecture_microprobe.py",
    "architecture_v2_helper": ROOT
    / "scripts"
    / "run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py",
    "union_training_smoke_helper": ROOT
    / "scripts"
    / "run_return_to_form_tier0_detector0_two_hand_union_training_smoke.py",
}


class StrictGateSmokeError(RuntimeError):
    """Raised when the strict-gate local smoke cannot produce valid evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--contract", type=Path, default=CONTRACT_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    parser.add_argument("--target-id", default=UNION_TARGET_ID)
    parser.add_argument("--max-epochs", type=int, default=120)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--weight-decay", type=float, default=0.0001)
    parser.add_argument("--gradient-clip", type=float, default=1.0)
    parser.add_argument("--smooth-l1-beta", type=float, default=0.02)
    parser.add_argument("--iou-loss-weight", type=float, default=0.25)
    parser.add_argument("--focal-gamma", type=float, default=2.0)
    parser.add_argument("--hard-negative-weight", type=float, default=1.0)
    parser.add_argument("--seed", type=int, default=223607)
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def command_line() -> str:
    return " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv])


def git_head() -> str:
    result = subprocess.run(
        ["git", "log", "-1", "--oneline"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def brev_read_only_status() -> dict[str, Any]:
    command = ["brev", "ls", "--json"]
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except Exception as error:  # noqa: BLE001 - receipt should preserve the no-spend boundary.
        return {
            "checked": False,
            "command": "brev ls --json",
            "error": str(error),
            "lifecycle_command_run": False,
            "remote_command_run": False,
            "spent_money_this_slice": False,
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
        "status": parsed,
        "lifecycle_command_run": False,
        "remote_command_run": False,
        "spent_money_this_slice": False,
    }


def require_same_array(name: str, actual: Any, expected: list[str]) -> None:
    if actual != expected:
        raise StrictGateSmokeError(f"contract {name} mismatch: expected {expected}, got {actual}")


def load_contract(path: Path) -> dict[str, Any]:
    contract = read_json(path.resolve())
    policy = contract.get("strict_gate_policy")
    if not isinstance(policy, dict):
        raise StrictGateSmokeError("contract missing strict_gate_policy")
    integration = contract.get("main_branch_integration_contract")
    if not isinstance(integration, dict):
        raise StrictGateSmokeError("contract missing main_branch_integration_contract")
    if contract.get("status") != "diagnostic_contract_only":
        raise StrictGateSmokeError(f"contract status is not diagnostic-only: {contract.get('status')}")
    if policy.get("variant_id") != "manifest_validation_fp05_contact_gate":
        raise StrictGateSmokeError(f"unexpected strict gate variant: {policy.get('variant_id')}")
    if policy.get("contact_gate_target") != UNION_TARGET_ID:
        raise StrictGateSmokeError(f"unexpected contact target: {policy.get('contact_gate_target')}")
    if policy.get("learned_region") != "right_or_second_hand":
        raise StrictGateSmokeError(f"unexpected learned region: {policy.get('learned_region')}")
    require_same_array("fixed_geometry_targets", policy.get("fixed_geometry_targets"), FIXED_GEOMETRY_TARGETS)
    require_same_array("learned_runtime_targets", policy.get("learned_runtime_targets"), LEARNED_RUNTIME_TARGETS)
    require_same_array("diagnostic_targets", policy.get("diagnostic_targets"), DIAGNOSTIC_TARGETS)
    if integration.get("future_target_script") != project_relative(Path(__file__).resolve()):
        raise StrictGateSmokeError(f"contract future_target_script does not point at this runner: {integration.get('future_target_script')}")
    threshold = policy.get("contact_threshold")
    if not isinstance(threshold, int | float) or not 0.0 <= float(threshold) <= 1.0:
        raise StrictGateSmokeError(f"invalid contact threshold: {threshold}")
    return contract


def confusion_at_threshold(scores: list[float], targets: list[bool], threshold: float) -> dict[str, Any]:
    predicted = [score >= threshold for score in scores]
    tp = sum(1 for pred, target in zip(predicted, targets, strict=True) if pred and target)
    tn = sum(1 for pred, target in zip(predicted, targets, strict=True) if not pred and not target)
    fp = sum(1 for pred, target in zip(predicted, targets, strict=True) if pred and not target)
    fn = sum(1 for pred, target in zip(predicted, targets, strict=True) if not pred and target)
    precision = None if tp + fp == 0 else tp / (tp + fp)
    recall = None if tp + fn == 0 else tp / (tp + fn)
    f1 = None if precision is None or recall is None or precision + recall == 0 else 2 * precision * recall / (precision + recall)
    negative_count = sum(1 for target in targets if not target)
    return {
        "threshold": threshold,
        "presence_accuracy": (tp + tn) / len(targets) if targets else None,
        "true_positive_count": tp,
        "true_negative_count": tn,
        "false_positive_count": fp,
        "false_negative_count": fn,
        "negative_count": negative_count,
        "false_positive_rate": None if negative_count == 0 else fp / negative_count,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def fp05_validation_threshold(scores: list[float], targets: list[bool], fp_rate_limit: float) -> dict[str, Any]:
    candidates = sorted(set([0.0, 1.0, *scores]))
    best: dict[str, Any] | None = None
    for threshold in candidates:
        metrics = confusion_at_threshold(scores, targets, threshold)
        fp_rate = metrics["false_positive_rate"]
        if fp_rate is not None and fp_rate > fp_rate_limit:
            continue
        recall = -1.0 if metrics["recall"] is None else metrics["recall"]
        f1 = -1.0 if metrics["f1"] is None else metrics["f1"]
        accuracy = -1.0 if metrics["presence_accuracy"] is None else metrics["presence_accuracy"]
        key = (recall, f1, accuracy, -metrics["false_positive_count"], -threshold)
        if best is None or key > best["_key"]:
            best = {**metrics, "_key": key}
    if best is None:
        best = confusion_at_threshold(scores, targets, 1.0)
        best["selection_blocker"] = "no threshold satisfied the false-positive-rate cap"
    best.pop("_key", None)
    best["selection_rule"] = "diagnostic only: maximize validation recall under false-positive-rate cap, then F1, accuracy, lower false positives, and lower threshold"
    best["threshold_selected_or_promoted"] = False
    best["false_positive_rate_limit"] = fp_rate_limit
    return best


def split_gate_metrics(rows_by_split: dict[str, list[dict[str, Any]]], threshold: float) -> dict[str, Any]:
    summary = {}
    for split, rows in rows_by_split.items():
        scores = [float(row["predicted_presence_score"]) for row in rows]
        targets = [bool(row["target_present"]) for row in rows]
        by_label: Counter[str] = Counter()
        learned_by_label: Counter[str] = Counter()
        for row, score in zip(rows, scores, strict=True):
            label = str(row["label_id"])
            by_label[label] += 1
            if score >= threshold:
                learned_by_label[label] += 1
        learned_count = sum(1 for score in scores if score >= threshold)
        summary[split] = {
            "packet_frame_row_count": len(rows),
            "contract_threshold_metrics": confusion_at_threshold(scores, targets, threshold),
            "learned_right_crop_gate": {
                "target_region": "viewer_right_hand_context",
                "decision_rule": f"use learned right crop when {UNION_TARGET_ID} score >= contract threshold",
                "used_learned_right_crop_rows": learned_count,
                "fallback_right_crop_rows": len(rows) - learned_count,
                "used_learned_right_crop_rate": None if not rows else learned_count / len(rows),
                "used_learned_right_crop_by_label": dict(sorted(learned_by_label.items())),
                "row_count_by_label": dict(sorted(by_label.items())),
            },
        }
    validation_rows = rows_by_split["validation"]
    validation_scores = [float(row["predicted_presence_score"]) for row in validation_rows]
    validation_targets = [bool(row["target_present"]) for row in validation_rows]
    return {
        "metric_scope": "packet_frame_rows_only_not_full_clip_recognizer_smoke",
        "contract_threshold": threshold,
        "validation_fp05_threshold_from_local_scores": fp05_validation_threshold(validation_scores, validation_targets, 0.05),
        "splits": summary,
    }


def claim_surface_proof() -> dict[str, Any]:
    model_card = read_json(MODEL_CARD_PATH)
    detector_card = read_json(DETECTOR_CARD_PATH)
    active_vocabulary = read_json(ACTIVE_VOCABULARY_PATH)
    active_labels = active_vocabulary.get("activeLabels")
    proof = {
        "model_card": {
            "path": project_relative(MODEL_CARD_PATH),
            "status": model_card.get("status"),
            "pretrained_components": model_card.get("architecture", {}).get("pretrained_components"),
        },
        "detector0_card": {
            "path": project_relative(DETECTOR_CARD_PATH),
            "status": detector_card.get("status"),
            "promotion_state": detector_card.get("promotion_state"),
            "browser_artifact": detector_card.get("browser_artifact"),
            "runtime_gates": detector_card.get("runtime_gates"),
        },
        "active_vocabulary_claim": {
            "path": project_relative(ACTIVE_VOCABULARY_PATH),
            "modelVersion": active_vocabulary.get("modelVersion"),
            "active_label_count": len(active_labels) if isinstance(active_labels, list) else None,
        },
        "fail_closed": (
            model_card.get("status") == "not_trained"
            and detector_card.get("status") == "not_trained"
            and detector_card.get("promotion_state") == "research_only"
            and detector_card.get("browser_artifact") is None
            and isinstance(active_labels, list)
            and len(active_labels) == 0
        ),
    }
    if not proof["fail_closed"]:
        raise StrictGateSmokeError(f"claim surfaces are not fail-closed: {proof}")
    return proof


def main() -> int:
    args = parse_args()
    if args.target_id != UNION_TARGET_ID:
        raise StrictGateSmokeError(f"--target-id must be {UNION_TARGET_ID}")
    if args.max_epochs < 1:
        raise StrictGateSmokeError("--max-epochs must be positive")

    contract = load_contract(args.contract)
    policy = contract["strict_gate_policy"]
    threshold = float(policy["contact_threshold"])
    torch = import_torch()
    dataset, packet_evidence = load_architecture_dataset(torch, args.packet.resolve())
    train_args = SimpleNamespace(
        device=args.device,
        max_epochs=args.max_epochs,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        gradient_clip=args.gradient_clip,
        smooth_l1_beta=args.smooth_l1_beta,
        iou_loss_weight=args.iou_loss_weight,
        focal_gamma=args.focal_gamma,
        hard_negative_weight=args.hard_negative_weight,
        seed=args.seed,
    )
    result = train_microprobe(torch, train_args, dataset)
    gate_metrics = split_gate_metrics(result["row_level_predictions"], threshold)
    next_action = "continue_detector0_strict_gate_metric_triage_no_brev"
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise StrictGateSmokeError(f"unexpected next action: {next_action}")

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed_local_strict_gate_smoke",
        "created_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3FR Detector 0 strict-gate local smoke",
        "head": git_head(),
        "active_prompt": ACTIVE_PROMPT,
        "command": command_line(),
        "runtime_bound": {
            "device_scope": "local Mac CPU/MPS only",
            "device": args.device,
            "max_epochs": args.max_epochs,
            "max_spend_usd": 0,
            "model_artifact_saved": False,
            "output_tensor_dir_created": False,
            "recognizer_training_or_completed_checkpoint_evaluation": False,
        },
        "m3fq_contract": {
            "path": project_relative(args.contract.resolve()),
            "sha256": sha256_file(args.contract.resolve()),
            "variant_id": policy["variant_id"],
            "contact_gate_target": policy["contact_gate_target"],
            "contact_threshold": threshold,
            "validation_frame_false_positive_rate_limit": policy["validation_frame_false_positive_rate_limit"],
            "fixed_geometry_targets": policy["fixed_geometry_targets"],
            "learned_runtime_targets": policy["learned_runtime_targets"],
            "diagnostic_targets": policy["diagnostic_targets"],
            "side_contract_transform_summary": policy["transform_summary"],
            "side_contract_recognizer_smoke_metrics": policy["recognizer_smoke_metrics"],
        },
        "main_branch_files_inspected": [
            project_relative(path)
            for path in [
                Path(__file__).resolve(),
                ROOT / "scripts" / "run_return_to_form_tier0_detector0_union_target_architecture_microprobe.py",
                ROOT / "scripts" / "run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py",
                ROOT / "scripts" / "run_return_to_form_tier0_detector0_two_hand_union_training_smoke.py",
                ROOT / "scripts" / "run_return_to_form_tier0_crop_norm_ablation_smoke.py",
                ROOT / "scripts" / "run_return_to_form_tier0_policy_aware_crop_norm_ablation_smoke.py",
                ROOT / "scripts" / "audit_detector0_strict_gate_crop_contract.mjs",
                args.contract.resolve(),
                M3FQ_RECEIPT_PATH,
                MODEL_CARD_PATH,
                DETECTOR_CARD_PATH,
                ACTIVE_VOCABULARY_PATH,
            ]
        ],
        "main_branch_files_changed": [
            project_relative(Path(__file__).resolve()),
            project_relative(args.output.resolve()),
            project_relative(SESSION_LOG_PATH),
        ],
        "local_smoke": {
            "script_created": True,
            "script_path": project_relative(Path(__file__).resolve()),
            "output_path": project_relative(args.output.resolve()),
            "output_paths": {
                "tracked_receipt": project_relative(args.output.resolve()),
                "model_artifact": None,
                "generated_tensor_dir": None,
            },
            "packet_evidence": packet_evidence,
            "microprobe": {
                "target_id": UNION_TARGET_ID,
                "device": result["device"],
                "model_parameter_count": result["model_parameter_count"],
                "epochs_ran": result["epochs_ran"],
                "seed": args.seed,
                "loss_movement": result["loss_movement"],
                "metrics": result["metrics"],
            },
            "strict_gate_crop_normalization": gate_metrics,
            "recognizer_smoke": {
                "run": False,
                "reason": "M3FR proved the strict contact gate can drive main-branch packet-frame crop decisions; recognizer fitting/evaluation remains a separate no-Brev metric-triage decision.",
            },
            "diagnostic_only": True,
            "not_detector0_product_authority": True,
            "not_browser_recognition_authority": True,
            "not_asl_correctness_authority": True,
        },
        "claim_surface_proof": claim_surface_proof(),
        "brev_read_only_default_off_state": brev_read_only_status(),
        "source_artifacts": {name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
        "forbidden_actions_not_run": [
            "brev_start_exec_sync_copy_stop_or_remote_command",
            "remote_command",
            "package_install",
            "source_register_edit",
            "source_or_media_import",
            "manifest_tensor_packet_or_vocabulary_mutation",
            "export_or_promotion",
            "model_card_promotion",
            "active_vocabulary_promotion",
            "browser_recognition_activation",
            "runtime_detector_authority_claim",
            "final_gate_change",
            "pretrained_detector_landmark_backbone_embedding_or_generated_label_path",
            "raw_learner_video_or_frame_upload",
            "wholesale_side_worktree_merge",
            "fake_detector_or_recognizer_output",
            "unsupported_correctness_or_readiness_claim",
            "push",
            "amend",
            "destructive_reset",
            "no_verify_commit",
        ],
        "next_action": next_action,
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output.resolve()),
                "device": result["device"],
                "epochs_ran": result["epochs_ran"],
                "validation_contract_threshold": gate_metrics["splits"]["validation"]["contract_threshold_metrics"],
                "validation_learned_right_crop_rate": gate_metrics["splits"]["validation"]["learned_right_crop_gate"][
                    "used_learned_right_crop_rate"
                ],
                "next_action": next_action,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (StrictGateSmokeError, Detector0SmokeError, TrainingError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
