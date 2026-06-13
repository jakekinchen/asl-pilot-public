#!/usr/bin/env python3
"""Build the Mission 3BJ post-review Brev and ML route recovery receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = (
    PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-post-review-ml-route-recovery-v1.json"
)
SCHEMA_VERSION = "asl-pilot-post-review-ml-route-recovery/v1"

ACTIVE_PROMPT = (
    PROJECT_ROOT
    / "docs"
    / "model"
    / "return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md"
)
PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md"
TRAINING_PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "dataset-and-training-plan.md"
SOURCE_REGISTER_PATH = PROJECT_ROOT / "docs" / "model" / "dataset-source-register.json"
GOAL_PATH = PROJECT_ROOT / "GOAL.md"

SOURCE_OF_TRUTH_PATHS = [
    GOAL_PATH,
    ACTIVE_PROMPT,
    PLAN_PATH,
    TRAINING_PLAN_PATH,
    SOURCE_REGISTER_PATH,
]

ROUTE_RECEIPTS = {
    "m3bi_final_readiness_gap": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-final-readiness-gap-audit-no-promotion-v1.json",
    "data_quality_contract": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-data-quality-contract-v1.json",
    "vocab_subset_contract": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-vocab-subset-contract-v1.json",
    "crop_region_contract": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-crop-region-contract-v1.json",
    "vocab_crop_diagnosis": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-vocab-crop-separability-diagnosis-v1.json",
    "detector0_architecture_microprobe_v2": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json",
    "region_grid_tcn_local_smoke": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-region-grid-tcn-local-smoke-v1.json",
    "region_grid_tcn_tiny_overfit": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-region-grid-tcn-tiny-overfit-v1.json",
    "overnight_brev_readiness": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-overnight-brev-readiness-v1.json",
    "overnight_cuda_smoke": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-overnight-cuda-smoke-v1.json",
    "asl_citizen_brev_training": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-asl-citizen-brev-training-v1.json",
}

CLAIM_SURFACES = [
    PROJECT_ROOT / "web" / "public" / "model" / "model-card.json",
    PROJECT_ROOT / "web" / "public" / "model" / "claim-matrix.json",
    PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    PROJECT_ROOT / "docs" / "validation" / "final-claim-matrix.json",
    PROJECT_ROOT / "web" / "public" / "model" / "browser-model-bundle.json",
    PROJECT_ROOT / "web" / "public" / "model" / "detector0-card.json",
]

BREV_LS_EVIDENCE = {
    "captured_at_local": "2026-05-27T14:57:25-05:00",
    "command": ["brev", "ls", "--json"],
    "exit_code": 1,
    "classification": "logged_out_prompt_eof",
    "raw_output_excerpt": (
        "You are currently logged out, would you like to log in? [Y/n]: "
        "... EOF, Attempt 1 ... EOF"
    ),
    "tokens_or_login_urls_recorded": False,
    "password_or_2fa_handled_by_agent": False,
    "worker_state_inspectable": False,
    "price_inspectable": False,
    "process_list_inspectable": False,
    "budget_inspectable": False,
    "paid_compute_legal_now": False,
    "duplicate_worker_created": False,
    "remote_command_run": False,
    "reason_no_login_probe_repeated": (
        "Session 350 already recorded that brev login --skip-browser reached "
        "the NVIDIA password screen for jakekinchen@gmail.com. A fresh brev ls "
        "--json result was enough to prove the CLI remains unauthenticated."
    ),
}

EXACTLY_ONE_NEXT_ACTION = "continue_semlex_overlap_and_source_review_no_training"


class ReceiptError(RuntimeError):
    """Raised when the M3BJ receipt cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-post-review-ml-route-recovery-v1.json"),
        help="Tracked M3BJ route recovery receipt path.",
    )
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ReceiptError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise ReceiptError(f"{context} missing: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, str]:
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ReceiptError(message)


def source_by_id(source_register: dict[str, Any], source_id: str) -> dict[str, Any] | None:
    for source in source_register.get("sources", []):
        if source.get("source_id") == source_id:
            return source
    return None


def prior_claim_hashes(m3bi_receipt: dict[str, Any]) -> dict[str, str]:
    refs = m3bi_receipt.get("claim_surfaces_verified_unchanged", [])
    return {
        str(ref.get("path")): str(ref.get("sha256"))
        for ref in refs
        if isinstance(ref, dict) and ref.get("path") and ref.get("sha256")
    }


def validate_claim_surfaces(m3bi_receipt: dict[str, Any]) -> list[dict[str, Any]]:
    prior_hashes = prior_claim_hashes(m3bi_receipt)
    claim_refs = []
    for path in CLAIM_SURFACES:
        relative = project_relative(path)
        current_hash = sha256_file(path)
        prior_hash = prior_hashes.get(relative)
        require(prior_hash == current_hash, f"claim surface changed since M3BI: {relative}")
        claim_refs.append(
            {
                "path": relative,
                "sha256": current_hash,
                "matches_m3bi_hash": True,
            }
        )
    return claim_refs


def validate_fail_closed_claim_values() -> dict[str, Any]:
    model_card = load_json(CLAIM_SURFACES[0])
    public_claim_matrix = load_json(CLAIM_SURFACES[1])
    active_vocab = load_json(CLAIM_SURFACES[2])
    final_claim_matrix = load_json(CLAIM_SURFACES[3])
    browser_bundle = load_json(CLAIM_SURFACES[4])
    detector_card = load_json(CLAIM_SURFACES[5])

    require(model_card["status"] == "not_trained", "model-card status must remain not_trained")
    require(public_claim_matrix["status"] == "no_active_claim_rawframe_not_trained", "public claim matrix must fail closed")
    require(final_claim_matrix["status"] == "no_active_claim_rawframe_not_trained", "final claim matrix must fail closed")
    require(public_claim_matrix.get("active_cv_claim") is None, "public claim matrix must not have active_cv_claim")
    require(final_claim_matrix.get("active_cv_claim") is None, "final claim matrix must not have active_cv_claim")
    require(active_vocab["modelVersion"] == "rawframe-not-trained", "active vocabulary must be rawframe-not-trained")
    require(active_vocab["activeLabels"] == [], "active vocabulary labels must remain empty")
    require(browser_bundle["recognition"]["enabled"] is False, "browser recognition must stay disabled")
    require(browser_bundle["detector0_tracking"]["enabled"] is False, "Detector 0 tracking must stay disabled")
    require(browser_bundle["box_driven_avatar"]["enabled"] is False, "box-driven avatar must stay disabled")
    require(detector_card["status"] == "not_trained", "Detector 0 card must stay not_trained")

    return {
        "model_card_status": model_card["status"],
        "model_id": model_card["model_id"],
        "active_vocabulary_model_version": active_vocab["modelVersion"],
        "active_labels": active_vocab["activeLabels"],
        "active_cv_claim": final_claim_matrix["active_cv_claim"],
        "claim_matrix_status": final_claim_matrix["status"],
        "public_claim_matrix_status": public_claim_matrix["status"],
        "browser_recognition_enabled": browser_bundle["recognition"]["enabled"],
        "detector0_status": detector_card["status"],
        "detector0_tracking_enabled": browser_bundle["detector0_tracking"]["enabled"],
        "box_driven_avatar_enabled": browser_bundle["box_driven_avatar"]["enabled"],
    }


def find_semlex_asl_lex_artifacts() -> list[dict[str, str]]:
    research_root = PROJECT_ROOT / "docs" / "research"
    if not research_root.exists():
        return []
    matches = []
    for path in sorted(research_root.iterdir(), key=lambda candidate: candidate.name):
        if not path.is_file():
            continue
        lower_name = path.name.lower()
        if "semlex" in lower_name or "asl-lex" in lower_name or "phonolog" in lower_name:
            matches.append(file_reference(path))
    return matches


def source_register_summary(source_register: dict[str, Any]) -> dict[str, Any]:
    asl_lex = source_by_id(source_register, "asl-lex")
    popsign = source_by_id(source_register, "popsign-v1-original-videos")
    asl_citizen_school = source_by_id(source_register, "asl-citizen-school-assignment-raw-videos")
    wlasl_school = source_by_id(source_register, "wlasl-school-assignment-raw-videos")

    require(asl_lex is not None, "source register must contain asl-lex")
    require(popsign is not None, "source register must contain popsign-v1-original-videos")
    require(asl_citizen_school is not None, "source register must contain asl-citizen-school-assignment-raw-videos")
    require(wlasl_school is not None, "source register must contain wlasl-school-assignment-raw-videos")
    require(asl_lex.get("allowed_for_model_training") is False, "ASL-LEX videos must remain blocked")
    require(popsign.get("allowed_for_model_training") is True, "PopSign original videos must remain approved")

    semlex_entries = [
        source
        for source in source_register.get("sources", [])
        if "semlex" in str(source.get("source_id", "")).lower()
        or "semlex" in str(source.get("display_name", "")).lower()
    ]

    return {
        "semlex_source_entry_present": bool(semlex_entries),
        "semlex_training_use_allowed_now": False,
        "semlex_entries": [
            {
                "source_id": source.get("source_id"),
                "display_name": source.get("display_name"),
                "allowed_for_model_training": source.get("allowed_for_model_training"),
                "license_review_status": source.get("license_review_status"),
            }
            for source in semlex_entries
        ],
        "asl_lex": {
            "source_id": asl_lex["source_id"],
            "allowed_for_model_training": asl_lex["allowed_for_model_training"],
            "allowed_for_validation": asl_lex["allowed_for_validation"],
            "license_review_status": asl_lex["license_review_status"],
            "decision_id": asl_lex["decision_id"],
            "training_use_allowed_now": False,
            "restriction_summary": asl_lex.get("restrictions", []),
        },
        "popsign_v1_original_videos": {
            "source_id": popsign["source_id"],
            "allowed_for_model_training": popsign["allowed_for_model_training"],
            "allowed_for_validation": popsign["allowed_for_validation"],
            "license_review_status": popsign["license_review_status"],
            "decision_id": popsign["decision_id"],
        },
        "asl_citizen_school_assignment_raw_videos": {
            "source_id": asl_citizen_school["source_id"],
            "allowed_for_model_training": asl_citizen_school["allowed_for_model_training"],
            "license_review_status": asl_citizen_school["license_review_status"],
            "decision_id": asl_citizen_school["decision_id"],
        },
        "wlasl_school_assignment_raw_videos": {
            "source_id": wlasl_school["source_id"],
            "allowed_for_model_training": wlasl_school["allowed_for_model_training"],
            "license_review_status": wlasl_school["license_review_status"],
            "decision_id": wlasl_school["decision_id"],
        },
    }


def validate_source_of_truth_text() -> dict[str, Any]:
    goal_text = GOAL_PATH.read_text(encoding="utf-8")
    prompt_text = ACTIVE_PROMPT.read_text(encoding="utf-8")
    training_plan_text = TRAINING_PLAN_PATH.read_text(encoding="utf-8")

    require("Mission 3BJ" in goal_text, "GOAL.md must name Mission 3BJ")
    require(
        "return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md" in goal_text,
        "GOAL.md must point at the M3BJ active prompt",
    )
    require("human continuation override" in goal_text.lower(), "GOAL.md must record the human continuation override")
    require("return-to-form-post-review-ml-route-recovery-v1.json" in prompt_text, "active prompt must name the M3BJ receipt")
    require(EXACTLY_ONE_NEXT_ACTION in prompt_text, "active prompt must allow the selected next action")
    require("SemLex / ASL-LEX phonology is a candidate original-plan route" in training_plan_text, "training plan must retain SemLex / ASL-LEX caveat")
    require("source-register evidence" in training_plan_text, "training plan must require SemLex source evidence")
    require("vocabulary overlap" in training_plan_text, "training plan must require SemLex vocabulary overlap evidence")
    require("docs/research/" in training_plan_text, "training plan must place SemLex evidence under docs/research")

    return {
        "goal_names_mission_3bj": True,
        "goal_points_at_active_prompt": True,
        "human_continuation_override_recorded": True,
        "training_plan_semlex_caveat_recorded": True,
        "active_prompt_receipt_path_recorded": True,
    }


def validate_route_receipts(receipts: dict[str, dict[str, Any]]) -> dict[str, Any]:
    m3bi = receipts["m3bi_final_readiness_gap"]
    data_quality = receipts["data_quality_contract"]
    detector0 = receipts["detector0_architecture_microprobe_v2"]
    region_grid = receipts["region_grid_tcn_local_smoke"]
    tiny_overfit = receipts["region_grid_tcn_tiny_overfit"]
    asl_citizen_brev = receipts["asl_citizen_brev_training"]

    require(m3bi["exactly_one_next_action"] == "stop_for_human_product_review", "M3BI must have stopped for human product review")
    require(data_quality["candidate_subset"]["status"] == "none_currently_training_ready", "data-quality contract must still have no training-ready subset")
    require(
        data_quality["candidate_subset"]["training_worthy_subset_identified"] is False,
        "data-quality contract must not identify a training-worthy subset",
    )
    require(detector0["next_action"]["id"] == "stop_reduced_claim", "Detector 0 microprobe v2 must stop reduced claim")
    require(region_grid["status"] == "completed_smoke_target_failed", "region-grid local smoke must remain failed")
    require(tiny_overfit["status"] == "tiny_overfit_succeeded", "region-grid tiny overfit must remain diagnostic-only success")
    require(asl_citizen_brev["status"] == "blocked_after_training", "ASL Citizen Brev training must remain blocked after training")

    return {
        "m3bi_next_action": m3bi["exactly_one_next_action"],
        "data_quality_status": data_quality["candidate_subset"]["status"],
        "training_worthy_subset_identified": data_quality["candidate_subset"]["training_worthy_subset_identified"],
        "detector0_next_action": detector0["next_action"]["id"],
        "region_grid_tcn_local_status": region_grid["status"],
        "region_grid_tcn_tiny_status": tiny_overfit["status"],
        "asl_citizen_brev_status": asl_citizen_brev["status"],
    }


def build_route_comparison(
    source_summary: dict[str, Any],
    semlex_artifacts: list[dict[str, str]],
    route_status_summary: dict[str, Any],
) -> list[dict[str, Any]]:
    return [
        {
            "route": "SemLex / ASL-LEX source and phonology overlap",
            "classification": "selected_next_local_no_training_handoff",
            "training_use_allowed_now": False,
            "paid_compute_needed_now": False,
            "evidence": [
                "dataset-and-training-plan.md says SemLex / ASL-LEX phonology is candidate-only and requires source-register evidence plus a vocabulary-overlap artifact before use",
                "dataset-source-register.json keeps ASL-LEX video use blocked under blocked_video_permission_required",
                f"existing docs/research SemLex/ASL-LEX/phonology artifacts found: {len(semlex_artifacts)}",
            ],
            "route_specific_state": {
                "semlex_source_entry_present": source_summary["semlex_source_entry_present"],
                "asl_lex_license_review_status": source_summary["asl_lex"]["license_review_status"],
                "asl_lex_video_training_allowed": source_summary["asl_lex"]["allowed_for_model_training"],
                "existing_overlap_or_source_artifacts": semlex_artifacts,
            },
            "why_selected": (
                "This is the first preferred M3BJ local action and it is a "
                "source/vocabulary decision slice, not training, media import, "
                "or claim promotion. It can clarify whether a phonology-backed "
                "Tier 0 route exists before any new model work."
            ),
            "next_action_if_selected": EXACTLY_ONE_NEXT_ACTION,
        },
        {
            "route": "PopSign / Tier-0 repair",
            "classification": "source_allowed_but_not_training_ready_from_current_receipts",
            "training_use_allowed_now": True,
            "paid_compute_needed_now": False,
            "evidence": [
                "PopSign v1 original videos remain approved in the source register",
                "return-to-form-data-quality-contract-v1 reports no current training-worthy retained subset",
                "current route evidence points to source/vocab/crop repair before another training-style retry",
            ],
            "route_specific_state": {
                "source_allowed_for_model_training": source_summary["popsign_v1_original_videos"]["allowed_for_model_training"],
                "data_quality_status": route_status_summary["data_quality_status"],
                "training_worthy_subset_identified": route_status_summary["training_worthy_subset_identified"],
            },
            "next_action_if_selected": "continue_vocab_data_repair_no_training",
        },
        {
            "route": "Scratch Detector 0 / crop-normalization",
            "classification": "needs_annotation_or_schema_repair_before_more_training",
            "training_use_allowed_now": False,
            "paid_compute_needed_now": False,
            "evidence": [
                "M3AE-AP Detector 0 union-target architecture microprobe v2 fits train but selected stop_reduced_claim",
                "held-out behavior remained weak, so another Detector 0 training retry is not justified without annotation/schema repair",
            ],
            "route_specific_state": {
                "detector0_next_action": route_status_summary["detector0_next_action"],
            },
            "next_action_if_selected": "continue_detector0_annotation_or_schema_repair_no_brev",
        },
        {
            "route": "Region-grid true TCN recognizer",
            "classification": "needs_vocab_or_data_repair_before_new_model_probe",
            "training_use_allowed_now": False,
            "paid_compute_needed_now": False,
            "evidence": [
                "M3AX tiny overfit succeeded and proves the basic region-grid TCN path can memorize a tiny subset",
                "M3AW local smoke failed held-out validation/test targets",
                "M3AY diagnosed split, label, and crop drift rather than a simple optimizer path break",
            ],
            "route_specific_state": {
                "region_grid_tcn_local_status": route_status_summary["region_grid_tcn_local_status"],
                "region_grid_tcn_tiny_status": route_status_summary["region_grid_tcn_tiny_status"],
            },
            "next_action_if_selected": "continue_bounded_local_model_probe_no_brev",
        },
        {
            "route": "Brev compute",
            "classification": "blocked_by_auth_no_paid_run_legal_now",
            "training_use_allowed_now": False,
            "paid_compute_needed_now": True,
            "evidence": [
                "fresh brev ls --json exited 1 after logged-out prompt EOF",
                "worker state, candidate price, process list, and budget were not inspectable",
                "session 350 already records that login reached a human NVIDIA password screen",
            ],
            "route_specific_state": {
                "brev_auth_classification": BREV_LS_EVIDENCE["classification"],
                "worker_state_inspectable": BREV_LS_EVIDENCE["worker_state_inspectable"],
                "price_inspectable": BREV_LS_EVIDENCE["price_inspectable"],
                "process_list_inspectable": BREV_LS_EVIDENCE["process_list_inspectable"],
                "paid_compute_legal_now": BREV_LS_EVIDENCE["paid_compute_legal_now"],
            },
            "next_action_if_selected": "stop_for_brev_password_or_2fa_required",
        },
        {
            "route": "Product-only work",
            "classification": "not_selected_default_because_ml_data_handoff_available",
            "training_use_allowed_now": False,
            "paid_compute_needed_now": False,
            "evidence": [
                "M3BI says /, /lesson, and /validation are adequate only for fail-closed human review",
                "product review readiness is not trained recognition readiness",
                "a local source/vocabulary handoff remains available, so product-only polish should not be the default next action",
            ],
            "route_specific_state": {
                "m3bi_next_action": route_status_summary["m3bi_next_action"],
            },
            "next_action_if_selected": "not_selected",
        },
    ]


def build_receipt(receipt_path: Path) -> dict[str, Any]:
    resolved_receipt = project_path(receipt_path, "receipt path", must_exist=False)
    receipts = {key: load_json(path) for key, path in ROUTE_RECEIPTS.items()}
    source_register = load_json(SOURCE_REGISTER_PATH)
    source_truth_summary = validate_source_of_truth_text()
    route_status_summary = validate_route_receipts(receipts)
    claim_refs = validate_claim_surfaces(receipts["m3bi_final_readiness_gap"])
    fail_closed_values = validate_fail_closed_claim_values()
    source_summary = source_register_summary(source_register)
    semlex_artifacts = find_semlex_asl_lex_artifacts()

    require(BREV_LS_EVIDENCE["paid_compute_legal_now"] is False, "receipt must not authorize paid Brev compute")
    require(not semlex_artifacts, "this slice expects no prior SemLex/ASL-LEX overlap artifact")

    route_comparison = build_route_comparison(
        source_summary=source_summary,
        semlex_artifacts=semlex_artifacts,
        route_status_summary=route_status_summary,
    )
    selected_routes = [
        route
        for route in route_comparison
        if route.get("next_action_if_selected") == EXACTLY_ONE_NEXT_ACTION
    ]
    require(len(selected_routes) == 1, "exactly one route must select the next action")

    receipt = {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BJ - post-review Brev auth and ML route recovery",
        "status": "completed_no_spend_route_selected",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "generated_by": {
            "tool": project_relative(Path(__file__).resolve()),
            "script": file_reference(Path(__file__).resolve()),
            "command": [sys.executable, project_relative(Path(__file__).resolve()), "--receipt", project_relative(resolved_receipt), "--write-receipt"],
        },
        "scope": {
            "type": "post_review_brev_auth_and_ml_route_recovery",
            "why_smallest_useful": (
                "The slice records fresh Brev auth failure evidence, compares the "
                "current local ML/data routes, and chooses one no-spend source "
                "review handoff without changing data, model, product, or claim surfaces."
            ),
            "runtime_behavior_changed": False,
            "training_or_fitting_run": False,
        },
        "source_of_truth_validation": source_truth_summary,
        "input_artifacts": [file_reference(path) for path in SOURCE_OF_TRUTH_PATHS]
        + [file_reference(path) for path in ROUTE_RECEIPTS.values()],
        "m3bi_product_review_boundary": {
            "m3bi_next_action": route_status_summary["m3bi_next_action"],
            "human_continuation_override_recorded": True,
            "product_package_scope": "fail-closed human review only",
            "trained_recognition_readiness": False,
        },
        "brev_auth_and_compute_state": {
            **BREV_LS_EVIDENCE,
            "bounded_compute_receipt_required_before_paid_run": True,
            "max_runtime_minutes_authorized_by_this_receipt": 0,
            "max_spend_usd_authorized_by_this_receipt": 0,
            "kill_condition": "not_applicable_no_remote_command_selected",
            "remote_artifact_copyback_plan": "not_applicable_no_remote_command_selected",
            "teardown_required_now": False,
        },
        "current_fail_closed_claim_values": fail_closed_values,
        "claim_surfaces_verified_unchanged": claim_refs,
        "source_register_state": source_summary,
        "route_status_summary": route_status_summary,
        "route_comparison": route_comparison,
        "selected_route": selected_routes[0],
        "exactly_one_next_action": EXACTLY_ONE_NEXT_ACTION,
        "blocked_actions_requiring_human_approval": [
            "Brev password, OTP, 2FA, live login URL handling, or credential persistence",
            "Brev worker lifecycle changes or paid compute before auth, worker state, price, process list, cap, and cleanup are inspectable",
            "duplicate Brev worker creation",
            "source approval expansion, media import, manual annotation, generated pseudo-labels, or SemLex training use",
            "broad 75/80/95-label training, model fitting, checkpoint creation, sweep, export, browser activation, or model-card promotion",
            "final readiness claims, positive ASL correctness claims, threshold promotion, or final gate changes",
            "push",
        ],
        "guardrails": {
            "brev_used_for_paid_compute": False,
            "paid_compute_used": False,
            "duplicate_brev_worker_created": False,
            "worker_state_inspected": False,
            "process_list_inspected": False,
            "source_imported": False,
            "source_approval_changed": False,
            "semlex_training_use": False,
            "external_media_imported": False,
            "manifest_or_tensor_mutated": False,
            "training_or_fitting_run": False,
            "checkpoint_created": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_or_final_claims_changed": False,
            "browser_trained_activation": False,
            "detector0_tracking_enabled": False,
            "box_driven_avatar_authority_enabled": False,
            "final_gates_changed": False,
            "final_validation_promoted": False,
            "positive_recognition_outcome_created": False,
            "push": False,
            "non_promotion": (
                "This receipt selects a no-training source/vocabulary review handoff only. "
                "It is not source approval, training readiness, browser readiness, "
                "model promotion, final validation, or an ASL correctness claim."
            ),
        },
        "validation_commands": {
            "initial_required_checks": [
                "git status --short --branch",
                "git log -10 --oneline --decorate",
                "node scripts/audit_loop_premise.mjs --json",
                "node scripts/audit_return_to_form_plan.mjs --json",
                "node scripts/audit_no_pretrained_deps.mjs",
                "node scripts/audit_no_pretrained_artifact_json.mjs",
                "python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py",
                "python3 -m json.tool docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json",
                "brev ls --json",
            ],
            "receipt_validation_expected": [
                "python3 -m py_compile scripts/audit_post_review_ml_route_recovery.py",
                "python3 scripts/audit_post_review_ml_route_recovery.py --write-receipt",
                "python3 scripts/audit_post_review_ml_route_recovery.py",
                "python3 -m json.tool docs/validation/return-to-form-post-review-ml-route-recovery-v1.json",
                "node scripts/audit_final_claim_matrix.mjs",
                "git diff --check",
            ],
        },
    }

    require(receipt["exactly_one_next_action"] == EXACTLY_ONE_NEXT_ACTION, "wrong selected next action")
    require(receipt["guardrails"]["paid_compute_used"] is False, "paid compute must remain false")
    require(receipt["guardrails"]["training_or_fitting_run"] is False, "training must remain false")
    require(receipt["current_fail_closed_claim_values"]["model_card_status"] == "not_trained", "model card must remain not_trained")
    return receipt


def main() -> int:
    args = parse_args()
    try:
        receipt = build_receipt(args.receipt)
        receipt_path = project_path(args.receipt, "receipt path", must_exist=False)
        if args.write_receipt:
            write_json(receipt_path, receipt)
        print(
            json.dumps(
                {
                    "status": "passed",
                    "receipt": project_relative(receipt_path),
                    "exactly_one_next_action": receipt["exactly_one_next_action"],
                    "brev_auth_classification": receipt["brev_auth_and_compute_state"]["classification"],
                    "paid_compute_used": receipt["guardrails"]["paid_compute_used"],
                    "training_or_fitting_run": receipt["guardrails"]["training_or_fitting_run"],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except ReceiptError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
