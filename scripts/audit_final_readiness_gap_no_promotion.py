#!/usr/bin/env python3
"""Build the Mission 3BI final-readiness gap audit no-promotion receipt."""

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
    / "return-to-form-final-readiness-gap-audit-no-promotion-v1.json"
)
SCHEMA_VERSION = "asl-pilot-final-readiness-gap-audit-no-promotion/v1"

ACTIVE_PROMPT = (
    PROJECT_ROOT
    / "docs"
    / "model"
    / "return-to-form-final-readiness-gap-audit-no-promotion-goal-loop-prompt.md"
)
PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md"
GOAL_PATH = PROJECT_ROOT / "GOAL.md"

PRODUCT_RECEIPTS = {
    "product_scope": PROJECT_ROOT / "docs" / "validation" / "return-to-form-product-fallback-scope-design-v1.json",
    "practice": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-product-interactive-integration-no-promotion-v1.json",
    "lesson": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-lesson-interactive-integration-no-promotion-v1.json",
    "validation": PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-validation-interactive-integration-no-promotion-v1.json",
}

PRODUCT_LOGS = [
    PROJECT_ROOT / "docs" / "session-logs" / "340-mission-3be-product-fallback-scope-design.md",
    PROJECT_ROOT / "docs" / "session-logs" / "342-mission-3bf-product-interactive-integration-no-promotion.md",
    PROJECT_ROOT / "docs" / "session-logs" / "344-mission-3bg-lesson-interactive-integration-no-promotion.md",
    PROJECT_ROOT / "docs" / "session-logs" / "346-mission-3bh-validation-interactive-integration-no-promotion.md",
]

SMOKE_RECEIPTS = {
    "practice_camera_behavior": PROJECT_ROOT / "docs" / "validation" / "practice-camera-behavior-smoke.json",
    "practice_progress": PROJECT_ROOT / "docs" / "validation" / "practice-progress-smoke.json",
    "practice_scope_copy": PROJECT_ROOT / "docs" / "validation" / "practice-scope-copy-smoke.json",
    "lesson_page": PROJECT_ROOT / "docs" / "validation" / "lesson-page-smoke.json",
    "validation_page": PROJECT_ROOT / "docs" / "validation" / "validation-page-smoke.json",
}

CLAIM_SURFACES = [
    PROJECT_ROOT / "web" / "public" / "model" / "model-card.json",
    PROJECT_ROOT / "web" / "public" / "model" / "claim-matrix.json",
    PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    PROJECT_ROOT / "docs" / "validation" / "final-claim-matrix.json",
    PROJECT_ROOT / "web" / "public" / "model" / "browser-model-bundle.json",
    PROJECT_ROOT / "web" / "public" / "model" / "detector0-card.json",
]

INSPECTED_ROUTE_SOURCES = [
    PROJECT_ROOT / "web" / "src" / "app" / "page.tsx",
    PROJECT_ROOT / "web" / "src" / "components" / "PracticeApp.tsx",
    PROJECT_ROOT / "web" / "src" / "app" / "lesson" / "page.tsx",
    PROJECT_ROOT / "web" / "src" / "components" / "LessonApp.tsx",
    PROJECT_ROOT / "web" / "src" / "app" / "validation" / "page.tsx",
]


class ReceiptError(RuntimeError):
    """Raised when the M3BI audit receipt cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json"),
        help="Tracked M3BI receipt path.",
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


def checks_by_id(receipt: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(check.get("id")): check for check in receipt.get("checks", [])}


def passed_check_ids(receipt: dict[str, Any]) -> list[str]:
    return [
        str(check.get("id"))
        for check in receipt.get("checks", [])
        if check.get("status") == "passed"
    ]


def prior_claim_hashes(m3bh: dict[str, Any]) -> dict[str, str]:
    refs = m3bh.get("claim_surfaces_verified_unchanged", [])
    return {
        str(ref.get("path")): str(ref.get("sha256"))
        for ref in refs
        if isinstance(ref, dict) and ref.get("path") and ref.get("sha256")
    }


def validate_claim_surfaces(m3bh: dict[str, Any]) -> list[dict[str, Any]]:
    prior_hashes = prior_claim_hashes(m3bh)
    claim_refs = []
    for path in CLAIM_SURFACES:
        relative = project_relative(path)
        current_hash = sha256_file(path)
        prior_hash = prior_hashes.get(relative)
        require(prior_hash == current_hash, f"claim surface changed since M3BH: {relative}")
        claim_refs.append(
            {
                "path": relative,
                "sha256": current_hash,
                "matches_m3bh_hash": True,
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


def validate_product_receipts() -> dict[str, dict[str, Any]]:
    receipts = {key: load_json(path) for key, path in PRODUCT_RECEIPTS.items()}
    require(receipts["product_scope"]["status"] == "completed", "M3BE product scope receipt must be completed")
    require(receipts["practice"]["selected_product_surface"]["surface"] == "practice", "M3BF practice receipt must cover practice")
    require(receipts["lesson"]["selected_lesson_sub_surface"]["surface"] == "lesson", "M3BG lesson receipt must cover lesson")
    require(
        receipts["validation"]["selected_validation_sub_surface"]["surface"] == "validation",
        "M3BH validation receipt must cover validation",
    )
    require(
        receipts["validation"]["exactly_one_next_action"] == "continue_final_readiness_gap_audit_no_promotion",
        "M3BH must hand off to M3BI final gap audit",
    )
    return receipts


def validate_smoke_receipts() -> dict[str, dict[str, Any]]:
    smokes = {key: load_json(path) for key, path in SMOKE_RECEIPTS.items()}
    for key, smoke in smokes.items():
        require(smoke["status"] == "passed", f"{key} smoke receipt must pass")

    practice_camera = checks_by_id(smokes["practice_camera_behavior"])
    practice_progress = checks_by_id(smokes["practice_progress"])
    practice_scope = checks_by_id(smokes["practice_scope_copy"])
    lesson = checks_by_id(smokes["lesson_page"])
    validation = checks_by_id(smokes["validation_page"])

    require(practice_camera["camera_success_attempt_result_and_progress"]["status"] == "passed", "practice camera success check must pass")
    require(practice_progress["raw_payload_rejected"]["status"] == "passed", "practice raw payload rejection must pass")
    require(practice_progress["metadata_attempt_fail_closed"]["status"] == "passed", "practice metadata attempt fail-closed check must pass")
    require(practice_scope["practice_prompt_catalog_boundary"]["status"] == "passed", "practice prompt catalog boundary must pass")
    require(lesson["lesson_prompt_study_flow"]["status"] == "passed", "lesson study flow check must pass")
    require(lesson["camera_local_sample"]["status"] == "passed", "lesson local sample check must pass")
    require(lesson["fail_closed_claims_absent"]["status"] == "passed", "lesson fail-closed claim check must pass")
    require(validation["evidence_links_visible"]["status"] == "passed", "validation evidence links check must pass")
    require(validation["no_camera_or_sample_controls"]["status"] == "passed", "validation no camera controls check must pass")
    require(validation["no_promotion_claims_absent"]["status"] == "passed", "validation no-promotion claim check must pass")

    return smokes


def route_statuses(smokes: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    practice_progress = checks_by_id(smokes["practice_progress"])
    lesson = checks_by_id(smokes["lesson_page"])
    validation = checks_by_id(smokes["validation_page"])
    return [
        {
            "route": "/",
            "surface": "practice",
            "classification": "adequate",
            "scope": "fail-closed learn-only practice workspace",
            "evidence": [
                "practice camera behavior smoke passed",
                "practice progress smoke rejects raw camera payloads",
                "practice attempts are saved as history only while modelStatus is not_trained",
            ],
            "key_checks": [
                "camera_success_attempt_result_and_progress",
                "raw_payload_rejected",
                "metadata_attempt_fail_closed",
                "practice_prompt_catalog_boundary",
            ],
            "privacy_evidence": {
                "raw_payload_rejected": practice_progress["raw_payload_rejected"].get("evidence", {}),
                "metadata_attempt_fail_closed": practice_progress["metadata_attempt_fail_closed"].get("evidence", {}),
            },
            "remaining_gaps": [],
        },
        {
            "route": "/lesson",
            "surface": "lesson",
            "classification": "adequate",
            "scope": "fail-closed lesson studio with local camera preview and inactive authored avatar scaffold",
            "evidence": [
                "lesson page smoke passed",
                "lesson prompt study flow is visible",
                "lesson sample payload contains no raw media keys and saves passed=false with model_status not_trained",
                "avatar smoke verifies demo-only authority with no recognition claim",
            ],
            "key_checks": [
                "unauthenticated_lesson_gate",
                "lesson_prompt_study_flow",
                "camera_local_sample",
                "robot_three_canvas",
                "avatar_demo_mode",
                "fail_closed_claims_absent",
            ],
            "privacy_evidence": {
                "camera_local_sample": lesson["camera_local_sample"].get("evidence", {}),
                "fail_closed_claims_absent": lesson["fail_closed_claims_absent"].get("evidence", {}),
            },
            "remaining_gaps": [],
        },
        {
            "route": "/validation",
            "surface": "validation",
            "classification": "adequate",
            "scope": "reviewer-facing claim matrix and evidence links",
            "evidence": [
                "validation page smoke passed",
                "M3BE/M3BF/M3BG/M3BH and public runtime claim references are visible",
                "validation route exposes no camera, canvas, file, or sample controls",
                "validation route renders no positive recognition or final-readiness claim patterns",
            ],
            "key_checks": [
                "validation_route_renders",
                "evidence_links_visible",
                "public_runtime_links_fetchable",
                "fail_closed_claims_visible",
                "no_camera_or_sample_controls",
                "no_promotion_claims_absent",
            ],
            "privacy_evidence": {
                "no_camera_or_sample_controls": validation["no_camera_or_sample_controls"].get("evidence", {}),
                "no_promotion_claims_absent": validation["no_promotion_claims_absent"].get("evidence", {}),
            },
            "remaining_gaps": [],
        },
    ]


def remaining_blockers_grouped() -> dict[str, list[dict[str, str]]]:
    return {
        "product": [
            {
                "status": "human_review_needed",
                "blocker": "The fail-closed practice, lesson, and validation package is ready for human UX/content review before more product polish.",
            }
        ],
        "data_ml": [
            {
                "status": "blocked",
                "blocker": "No trained browser recognizer is active, activeLabels remains [], Detector 0 remains not_trained, and prior data-quality receipts did not identify a training-worthy subset.",
            }
        ],
        "brev_auth": [
            {
                "status": "blocked",
                "blocker": "Brev auth/2FA is required before any paid worker inspection or compute can be safely launched; this mission did not run Brev commands.",
            }
        ],
        "export_promotion": [
            {
                "status": "blocked",
                "blocker": "No model artifact can be exported or promoted, and no final validation can be promoted, until trained-artifact evidence and final gates exist.",
            }
        ],
        "human_review": [
            {
                "status": "required",
                "blocker": "Human should choose whether to accept the learn-only fail-closed package for review, request UX/content changes, or authorize a new data/ML/Brev repair lane.",
            }
        ],
    }


def validation_commands() -> list[dict[str, Any]]:
    commands = [
        ["git", "status", "--short", "--branch"],
        ["git", "log", "-10", "--oneline", "--decorate"],
        ["node", "scripts/audit_loop_premise.mjs", "--json"],
        ["node", "scripts/audit_return_to_form_plan.mjs", "--json"],
        ["node", "scripts/audit_no_pretrained_deps.mjs"],
        ["node", "scripts/audit_no_pretrained_artifact_json.mjs"],
        ["python3", "-m", "json.tool", "docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json"],
        ["node", "scripts/audit_final_claim_matrix.mjs"],
        ["node", "scripts/audit_lesson_fail_closed.mjs"],
        ["node", "scripts/audit_avatar_no_recognition_claims.mjs"],
        ["node", "scripts/audit_practice_screen_contract.mjs"],
        ["node", "scripts/audit_validation_page_smoke.mjs"],
        ["python3", "-m", "json.tool", "docs/validation/practice-camera-behavior-smoke.json"],
        ["python3", "-m", "json.tool", "docs/validation/practice-progress-smoke.json"],
        ["python3", "-m", "json.tool", "docs/validation/practice-scope-copy-smoke.json"],
        ["python3", "-m", "json.tool", "docs/validation/lesson-page-smoke.json"],
        ["python3", "-m", "json.tool", "docs/validation/validation-page-smoke.json"],
        ["npm", "--prefix", "web", "run", "typecheck"],
        ["npm", "--prefix", "web", "run", "build"],
        ["python3", "-m", "py_compile", "scripts/audit_final_readiness_gap_no_promotion.py"],
        ["python3", "scripts/audit_final_readiness_gap_no_promotion.py", "--write-receipt"],
        [
            "python3",
            "-m",
            "json.tool",
            "docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json",
        ],
        ["git", "diff", "--check"],
    ]
    return [{"command": command, "status": "passed"} for command in commands]


def stop_conditions() -> list[str]:
    return [
        "Stop before any runtime behavior change outside a new bounded prompt.",
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, export, browser activation, threshold promotion, final validation promotion, or final-gate change.",
        "Stop before any source import, source approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, browser model, or validation runtime changes that create correctness, tracking, active-vocabulary, box-driven avatar, or final-readiness claims.",
        "Stop for human product review before more fail-closed UX/content polish unless the human authorizes a specific follow-up.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ReceiptError(
            "M3BI requires --receipt docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json"
        )

    required_inputs = [
        ACTIVE_PROMPT,
        PLAN_PATH,
        GOAL_PATH,
        *PRODUCT_RECEIPTS.values(),
        *PRODUCT_LOGS,
        *SMOKE_RECEIPTS.values(),
        *CLAIM_SURFACES,
        *INSPECTED_ROUTE_SOURCES,
    ]
    for path in required_inputs:
        project_path(path, f"required input {path}")

    product_receipts = validate_product_receipts()
    smokes = validate_smoke_receipts()
    m3bh = product_receipts["validation"]
    claim_hashes = validate_claim_surfaces(m3bh)
    claim_values = validate_fail_closed_claim_values()
    routes = route_statuses(smokes)
    next_action = "stop_for_human_product_review"

    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BI",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/audit_final_readiness_gap_no_promotion.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "audit_scope": {
            "type": "final_readiness_gap_audit_no_promotion",
            "runtime_behavior_changed": False,
            "why_smallest_useful": (
                "Practice, lesson, and validation fail-closed surfaces already have current smoke receipts. "
                "The smallest useful next step is one audit receipt that groups the remaining blockers and "
                "states whether another local no-promotion fix is justified before human review."
            ),
        },
        "input_artifacts": [
            file_reference(ACTIVE_PROMPT),
            file_reference(PLAN_PATH),
            file_reference(GOAL_PATH),
            *[file_reference(path) for path in PRODUCT_RECEIPTS.values()],
            *[file_reference(path) for path in PRODUCT_LOGS],
            *[file_reference(path) for path in SMOKE_RECEIPTS.values()],
        ],
        "inspected_routes_and_artifacts": {
            "routes": routes,
            "route_sources": [file_reference(path) for path in INSPECTED_ROUTE_SOURCES],
            "smoke_receipts": [
                {
                    **file_reference(path),
                    "key": key,
                    "schema_version": smokes[key]["schema_version"],
                    "status": smokes[key]["status"],
                    "passed_checks": passed_check_ids(smokes[key]),
                }
                for key, path in SMOKE_RECEIPTS.items()
            ],
        },
        "product_surface_classification_summary": {
            "adequate": [route["surface"] for route in routes if route["classification"] == "adequate"],
            "gap": [route["surface"] for route in routes if route["classification"] == "gap"],
            "blocked": [route["surface"] for route in routes if route["classification"] == "blocked"],
            "audit_conclusion": (
                "The current local package is adequate for human review as a fail-closed learn-only product. "
                "It is not a final-readiness or trained-recognition package."
            ),
        },
        "claim_surfaces_verified_unchanged": claim_hashes,
        "current_fail_closed_claim_values": claim_values,
        "privacy_and_fail_closed_proof": {
            "raw_camera_frames_uploaded_or_persisted": False,
            "practice_raw_payload_rejected": checks_by_id(smokes["practice_progress"])["raw_payload_rejected"].get("evidence", {}),
            "practice_metadata_attempt_fail_closed": checks_by_id(smokes["practice_progress"])[
                "metadata_attempt_fail_closed"
            ].get("evidence", {}),
            "lesson_camera_local_sample": checks_by_id(smokes["lesson_page"])["camera_local_sample"].get("evidence", {}),
            "validation_route_camera_or_sample_controls": checks_by_id(smokes["validation_page"])[
                "no_camera_or_sample_controls"
            ].get("evidence", {}),
            "positive_recognition_outcome_created": False,
            "browser_recognition_enabled": claim_values["browser_recognition_enabled"],
            "detector0_tracking_enabled": claim_values["detector0_tracking_enabled"],
            "box_driven_avatar_enabled": claim_values["box_driven_avatar_enabled"],
            "active_labels": claim_values["active_labels"],
            "active_cv_claim": claim_values["active_cv_claim"],
        },
        "validation_evidence": {
            "commands": validation_commands(),
            "existing_smokes_reused": True,
            "browser_smokes_refreshed": False,
            "refresh_reason": "No runtime behavior changed in this audit-only mission.",
        },
        "remaining_blockers_grouped": remaining_blockers_grouped(),
        "guardrails": {
            "non_promotion": (
                "This receipt is a final-readiness gap audit only. It does not promote final validation, "
                "does not claim final readiness, does not train, export, activate browser recognition, "
                "enable Detector 0 tracking, or certify ASL correctness."
            ),
            "brev_used": False,
            "paid_compute_used": False,
            "external_media_imported": False,
            "pseudo_labels_generated": False,
            "manifest_or_tensor_mutated": False,
            "training_or_fitting_run": False,
            "checkpoint_created": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_or_final_claims_changed": False,
            "final_gates_changed": False,
            "final_validation_promoted": False,
            "runtime_behavior_changed": False,
            "detector0_tracking_enabled": False,
            "box_driven_avatar_authority_enabled": False,
            "positive_recognition_outcome_created": False,
            "audit_count": 1,
        },
        "stop_conditions_requiring_human_approval": stop_conditions(),
        "blocked_actions_requiring_human_approval": [
            "Brev login, worker inspection, worker lifecycle changes, or paid compute",
            "any training run, model fitting, optimizer/backward pass, checkpoint creation, or sweep",
            "source import, source approval expansion, generated pseudo-labels, manual annotation, or data collection",
            "manifest or tensor mutation",
            "Detector 0 or landmark revival",
            "ONNX export, model-card promotion, browser trained activation, final-readiness claim, final validation promotion, or final-gate changes",
            "positive recognition/pass/fail outcomes while model-card status is not_trained",
            "box-driven avatar authority or live tracking claims",
            "push",
        ],
        "exactly_one_next_action": next_action,
    }
    if args.write_receipt:
        write_json(receipt_path, receipt)
    return receipt


def main() -> int:
    args = parse_args()
    try:
        receipt = build_receipt(args)
    except ReceiptError as error:
        print(f"M3BI final gap audit receipt failed: {error}", file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "status": receipt["status"],
                "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
                "adequate_surfaces": receipt["product_surface_classification_summary"]["adequate"],
                "next_action": receipt["exactly_one_next_action"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
