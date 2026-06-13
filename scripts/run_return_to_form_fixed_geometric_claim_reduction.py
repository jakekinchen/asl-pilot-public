#!/usr/bin/env python3
"""Write the M3ED fixed-geometric claim-reduction receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import shlex
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-fixed-geometric-claim-reduction/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-fixed-geometric-claim-reduction-v1.json"
ACTIVE_PROMPT = ROOT / "docs" / "model" / "return-to-form-fixed-geometric-claim-reduction-goal-loop-prompt.md"
SESSION_LOG = "docs/session-logs/503-mission-3ed-fixed-geometric-claim-reduction.md"
REFERENCE_PATHS = {
    "goal": ROOT / "GOAL.md",
    "active_prompt": ACTIVE_PROMPT,
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "codex_goal_loop_runbook": ROOT / "docs" / "runbooks" / "codex-goal-loop.md",
    "observer_runbook": ROOT / "docs" / "runbooks" / "observer-runbook-codex.md",
    "m3ec_crop_normalization_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-fixed-geometric-crop-normalization-smoke-v1.json",
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
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "packet": ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json",
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
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null",
    "python3 -m json.tool web/public/model/model-card.json >/dev/null",
    "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    "brev ls --json",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_fixed_geometric_claim_reduction.py",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
    "scripts/run_return_to_form_fixed_geometric_claim_reduction.py",
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null",
    "git diff --check",
]
ALLOWED_NEXT_ACTIONS = {
    "fixed_geometry_materialized_region_followup_no_brev",
    "return_to_detector0_after_annotation_budget",
    "escalate_crop_strategy_research",
    "stop_for_human_fixed_geometry_scope_review",
    "stop_reduced_claim",
}


class ClaimReductionError(RuntimeError):
    """Raised when the M3ED receipt cannot be produced."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
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
        raise ClaimReductionError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ClaimReductionError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise ClaimReductionError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(value, dict):
        raise ClaimReductionError(f"JSON root must be an object: {project_relative(path)}")
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def nested(data: dict[str, Any], path: list[str], context: str) -> Any:
    value: Any = data
    for key in path:
        if not isinstance(value, dict) or key not in value:
            raise ClaimReductionError(f"{context} missing {'.'.join(path)}")
        value = value[key]
    return value


def require_next_action(receipt: dict[str, Any], expected: str, context: str) -> None:
    actual = nested(receipt, ["next_action", "id"], context)
    if actual != expected:
        raise ClaimReductionError(f"{context} next_action expected {expected}, got {actual}")


def claim_surfaces(model_card: dict[str, Any], active_vocabulary: dict[str, Any]) -> dict[str, Any]:
    return {
        "model_card_status": model_card.get("status"),
        "active_labels": active_vocabulary.get("activeLabels"),
        "raw_model_card_path": project_relative(REFERENCE_PATHS["model_card"]),
        "raw_active_vocabulary_claim_path": project_relative(REFERENCE_PATHS["active_vocabulary_claim"]),
        "browser_recognition": "fail_closed_inactive",
        "claim_surface_mutated": False,
    }


def main() -> int:
    args = parse_args()
    m3ec = read_json(REFERENCE_PATHS["m3ec_crop_normalization_smoke"])
    m3eb = read_json(REFERENCE_PATHS["m3eb_fixed_geometric_fallback"])
    model_card = read_json(REFERENCE_PATHS["model_card"])
    active_vocabulary = read_json(REFERENCE_PATHS["active_vocabulary_claim"])

    require_next_action(m3ec, "fixed_geometry_claim_reduction", "M3EC receipt")
    require_next_action(m3eb, "prepare_fixed_geometric_crop_normalization_smoke_no_brev", "M3EB receipt")

    m3eb_policy = nested(m3eb, ["recommended_fallback_policy"], "M3EB receipt")
    m3ec_inclusion = nested(m3ec, ["inclusion_and_hidden_evidence_accounting", "summary"], "M3EC receipt")
    m3ec_materialization = nested(m3ec, ["fixed_crop_materialization", "transform_accounting"], "M3EC receipt")
    m3ec_future = nested(m3ec, ["future_no_brev_followup"], "M3EC receipt")
    primary_roi = nested(m3eb_policy, ["primary_roi"], "M3EB receipt")
    context_roi = nested(m3eb_policy, ["context_roi"], "M3EB receipt")

    next_action = "fixed_geometry_materialized_region_followup_no_brev"
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise ClaimReductionError(f"internal next action is not allowed: {next_action}")

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3ED - Fixed-geometric claim reduction",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": COMMANDS_RUN,
        "commands_intentionally_not_run": [
            "No crop-smoke rerun, classifier comparison, training, fitting, optimizer construction, backward pass, checkpoint, model artifact, ONNX export, model-card promotion, or product-runtime change.",
            "No Brev worker creation, sync, SSH, remote compute, remote training, stop, delete, reset, or spend.",
            "No source import, media download, source-register mutation, manifest mutation, tracked tensor mutation, vocabulary mutation, label expansion, or packet-row mutation.",
            "No hand-landmark source import, landmark detector training, pretrained detector/backbone/embedding/teacher/generated-label path, browser activation, ASL-correctness claim, final-readiness claim, raw learner video upload, or push.",
        ],
        "source_artifacts": {name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
        "files_changed": [
            "scripts/run_return_to_form_fixed_geometric_claim_reduction.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "input_evidence": {
            "m3eb_next_action": nested(m3eb, ["next_action", "id"], "M3EB receipt"),
            "m3ec_next_action": nested(m3ec, ["next_action", "id"], "M3EC receipt"),
            "m3ec_classification": nested(m3ec, ["outcome", "classification"], "M3EC receipt"),
            "m3ec_tensor_hash_verified_count": nested(
                m3ec,
                ["input_scope", "tensor_files_touched", "count"],
                "M3EC receipt",
            ),
            "m3ec_packet_rows_crosschecked": nested(
                m3ec,
                ["packet_evidence", "packet_tensor_frame_crosscheck", "checked_row_count"],
                "M3EC receipt",
            ),
            "m3ec_crop_smoke_rerun": False,
        },
        "current_claim_surface": claim_surfaces(model_card, active_vocabulary),
        "claim_reduction": {
            "exact_m3eb_primary_roi": {
                "roi": primary_roi,
                "allowed_claims": [
                    "Deterministic train-median ROI derived from approved packet boxes.",
                    "Can be applied locally from full_frame_reference tensors for diagnostic/accounting work.",
                    "Kept all present target centers inside for the current 32-row packet.",
                    "May be used as transparent fixed-geometry evidence only under fail-closed product claims.",
                ],
                "disallowed_claims": [
                    "Does not preserve all current hand/contact evidence.",
                    "Does not prove runtime Detector 0 objectness or negative specificity.",
                    "Does not prove hand localization, hand tracking, hand landmarks, ASL correctness, browser recognition, product authority, or final readiness.",
                    "Must not be used as the sole basis for a model-input comparison that claims interaction preservation.",
                ],
                "containment_evidence": {
                    "all_present_target_centers_inside": m3ec_inclusion[
                        "m3eb_primary_keeps_all_present_target_centers_inside"
                    ],
                    "left_hand_full_containment_rate": m3ec_inclusion[
                        "m3eb_primary_left_hand_full_containment_rate"
                    ],
                    "table_union_contact_full_containment_rate": m3ec_inclusion[
                        "m3eb_primary_table_union_full_containment_rate"
                    ],
                    "exact_roi_materialized_region_count": m3ec_materialization[
                        "m3eb_exact_roi_materialized_region_count"
                    ],
                    "full_frame_reference_available_count": m3ec_materialization[
                        "full_frame_reference_available_for_exact_roi_count"
                    ],
                },
            },
            "exact_m3eb_context_roi": {
                "roi": context_roi,
                "allowed_claims": [
                    "Deterministic head/face context crop for optional local accounting.",
                    "Can be applied from full_frame_reference tensors when a future no-Brev diagnostic needs context.",
                ],
                "disallowed_claims": [
                    "Does not prove face tracking, identity inference, landmarks, hand evidence preservation, browser recognition, ASL correctness, product authority, or final readiness.",
                ],
            },
            "materialized_upper_body_signing_space": {
                "region_id": "upper_body_signing_space",
                "box_xyxy_norm": [0.1, 0.1, 0.9, 0.96],
                "allowed_claims": [
                    "Already materialized in the existing approved region tensors.",
                    "Broader than the exact M3EB primary ROI for current table interaction evidence.",
                    "May be compared locally against full-frame references in one bounded no-Brev model-input follow-up.",
                ],
                "disallowed_claims": [
                    "Does not prove complete hand/contact preservation.",
                    "Does not prove Detector 0 objectness, hand landmarks, browser recognition, product authority, ASL correctness, or final readiness.",
                ],
                "containment_evidence": {
                    "table_union_contact_full_containment_rate": m3ec_inclusion[
                        "existing_upper_body_table_union_full_containment_rate"
                    ],
                    "right_hand_full_containment_rate": m3ec_inclusion[
                        "existing_upper_body_right_hand_full_containment_rate"
                    ],
                },
            },
            "materialized_head_context": {
                "region_id": "head_context",
                "box_xyxy_norm": [0.2, 0.0, 0.8, 0.44],
                "allowed_claims": [
                    "Already materialized in the existing approved region tensors.",
                    "May be included as optional context in a bounded no-Brev materialized-region follow-up.",
                ],
                "disallowed_claims": [
                    "Does not prove face tracking, identity inference, landmarks, hand/contact preservation, browser recognition, product authority, ASL correctness, or final readiness.",
                ],
            },
        },
        "global_disallowed_claims": {
            "runtime_detector0_objectness": "unproven",
            "hand_contact_preservation": "not_unqualified_for_exact_m3eb_roi",
            "hand_landmarks_or_tracking": "unavailable",
            "browser_recognition": "inactive",
            "product_authority": False,
            "asl_correctness": False,
            "final_readiness": False,
            "model_artifact_or_export": False,
        },
        "followup_decision": {
            "bounded_no_brev_followup_justified": True,
            "next_action": next_action,
            "may_test": (
                "A local materialized-region follow-up may compare existing upper_body_signing_space/head_context "
                "region inputs against full-frame references, using current approved tensors/manifests only, and must "
                "keep browser/product/model claims fail-closed."
            ),
            "must_not_test": [
                "exact M3EB ROI as unqualified interaction-preserving input",
                "runtime Detector 0 objectness",
                "hand landmarks or tracking",
                "browser recognition activation",
                "product readiness",
                "Brev or remote training",
                "new source/media/packet/manifest/tensor/vocabulary mutations",
            ],
            "m3ec_followup_context": m3ec_future,
        },
        "boundaries": {
            "local_only": True,
            "read_only_existing_evidence": True,
            "crop_smoke_rerun": False,
            "training": False,
            "fitting": False,
            "classifier_comparison": False,
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
        "docs_update": {
            "needed": False,
            "reason": (
                "GOAL.md and docs/model/return-to-form-plan.md already record M3EC's exact containment rates and "
                "state that M3ED is the claim-reduction mission; this receipt is the smallest durable claim boundary."
            ),
        },
        "outcome": {
            "classification": "fixed_geometry_claim_reduced_materialized_region_followup_allowed",
            "next_action": next_action,
            "reason": (
                "M3ED reduces exact M3EB ROI to deterministic diagnostic/accounting evidence only, while preserving "
                "one bounded no-Brev follow-up for the broader materialized upper-body/head regions under fail-closed claims."
            ),
        },
        "next_action": {
            "id": next_action,
            "reason": (
                "The exact M3EB ROI claim is now reduced, and existing materialized upper-body/head tensors can support "
                "one bounded local no-Brev follow-up without product authority."
            ),
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "classification": report["outcome"]["classification"],
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
    except ClaimReductionError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
