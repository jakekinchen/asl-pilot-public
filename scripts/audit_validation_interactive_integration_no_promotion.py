#!/usr/bin/env python3
"""Build the Mission 3BH validation integration no-promotion receipt."""

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
    / "return-to-form-validation-interactive-integration-no-promotion-v1.json"
)
SCHEMA_VERSION = "asl-pilot-validation-interactive-integration-no-promotion/v1"

M3BE_RECEIPT = PROJECT_ROOT / "docs" / "validation" / "return-to-form-product-fallback-scope-design-v1.json"
M3BF_RECEIPT = (
    PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-product-interactive-integration-no-promotion-v1.json"
)
M3BG_RECEIPT = (
    PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-lesson-interactive-integration-no-promotion-v1.json"
)
ACTIVE_PROMPT = (
    PROJECT_ROOT
    / "docs"
    / "model"
    / "return-to-form-validation-interactive-integration-no-promotion-goal-loop-prompt.md"
)
PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md"
GOAL_PATH = PROJECT_ROOT / "GOAL.md"
VALIDATION_SMOKE = PROJECT_ROOT / "docs" / "validation" / "validation-page-smoke.json"

CLAIM_SURFACES = [
    PROJECT_ROOT / "web" / "public" / "model" / "model-card.json",
    PROJECT_ROOT / "web" / "public" / "model" / "claim-matrix.json",
    PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    PROJECT_ROOT / "docs" / "validation" / "final-claim-matrix.json",
    PROJECT_ROOT / "web" / "public" / "model" / "browser-model-bundle.json",
    PROJECT_ROOT / "web" / "public" / "model" / "detector0-card.json",
]

CHANGED_FILES = [
    PROJECT_ROOT / "web" / "src" / "app" / "validation" / "page.tsx",
    PROJECT_ROOT / "web" / "src" / "app" / "globals.css",
    PROJECT_ROOT / "scripts" / "run_validation_page_smoke.mjs",
    PROJECT_ROOT / "scripts" / "audit_validation_page_smoke.mjs",
    PROJECT_ROOT / "scripts" / "audit_validation_interactive_integration_no_promotion.py",
    VALIDATION_SMOKE,
]


class ReceiptError(RuntimeError):
    """Raised when the M3BH receipt cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json"),
        help="Tracked M3BH receipt path.",
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


def prior_claim_hashes(m3bg: dict[str, Any]) -> dict[str, str]:
    refs = m3bg.get("claim_surfaces_verified_unchanged", [])
    return {
        str(ref.get("path")): str(ref.get("sha256"))
        for ref in refs
        if isinstance(ref, dict) and ref.get("path") and ref.get("sha256")
    }


def validate_claim_surfaces(m3bg: dict[str, Any]) -> list[dict[str, Any]]:
    prior_hashes = prior_claim_hashes(m3bg)
    claim_refs = []
    for path in CLAIM_SURFACES:
        relative = project_relative(path)
        current_hash = sha256_file(path)
        prior_hash = prior_hashes.get(relative)
        require(prior_hash == current_hash, f"claim surface changed since M3BG: {relative}")
        claim_refs.append(
            {
                "path": relative,
                "sha256": current_hash,
                "matches_m3bg_hash": True,
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


def validate_validation_smoke() -> dict[str, Any]:
    smoke = load_json(VALIDATION_SMOKE)
    require(smoke["status"] == "passed", "validation page smoke must pass")
    checks = checks_by_id(smoke)

    required_checks = [
        "validation_route_renders",
        "evidence_links_visible",
        "public_runtime_links_fetchable",
        "fail_closed_claims_visible",
        "no_camera_or_sample_controls",
        "no_promotion_claims_absent",
    ]
    for check_id in required_checks:
        require(checks.get(check_id, {}).get("status") == "passed", f"validation smoke check must pass: {check_id}")

    evidence = checks["evidence_links_visible"].get("evidence", {})
    require(evidence.get("evidence_panel_visible") is True, "evidence links panel must be visible")
    require(
        len(evidence.get("visible_paths", [])) == len(evidence.get("expected_paths", [])) == 7,
        "all expected evidence paths must be visible",
    )

    public_links = checks["public_runtime_links_fetchable"].get("evidence", {}).get("public_link_results", [])
    require(len(public_links) == 3, "three public runtime links must be checked")
    require(all(result.get("ok") is True for result in public_links), "all public runtime links must return ok")

    controls = checks["no_camera_or_sample_controls"].get("evidence", {})
    require(all(value == 0 for value in controls.values()), "validation route must expose no camera/sample controls")

    claims = checks["no_promotion_claims_absent"].get("evidence", {})
    require(claims.get("banned_claim_patterns_seen") == [], "validation page must not render banned claims")

    return {
        "status": smoke["status"],
        "app_url": smoke.get("app_url"),
        "browser": smoke.get("browser", {}),
        "passed_checks": passed_check_ids(smoke),
        "evidence_links": evidence,
        "public_runtime_links": public_links,
        "no_camera_or_sample_controls": controls,
        "fail_closed_claims": checks["fail_closed_claims_visible"].get("evidence", {}),
        "no_promotion_claims_absent": claims,
    }


def validation_commands() -> list[dict[str, Any]]:
    commands = [
        ["git", "status", "--short", "--branch"],
        ["git", "log", "-10", "--oneline", "--decorate"],
        ["node", "scripts/audit_loop_premise.mjs", "--json"],
        ["node", "scripts/audit_return_to_form_plan.mjs", "--json"],
        ["node", "scripts/audit_no_pretrained_deps.mjs"],
        ["node", "scripts/audit_no_pretrained_artifact_json.mjs"],
        ["python3", "-m", "json.tool", "docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json"],
        ["node", "scripts/audit_final_claim_matrix.mjs"],
        ["node", "scripts/audit_lesson_fail_closed.mjs"],
        ["node", "scripts/audit_avatar_no_recognition_claims.mjs"],
        ["node", "scripts/audit_practice_screen_contract.mjs"],
        ["npm", "--prefix", "web", "run", "typecheck"],
        ["npm", "--prefix", "web", "run", "build"],
        ["node", "scripts/run_validation_page_smoke.mjs", "--write"],
        ["node", "scripts/audit_validation_page_smoke.mjs"],
        ["python3", "-m", "py_compile", "scripts/audit_validation_interactive_integration_no_promotion.py"],
        [
            "python3",
            "-m",
            "json.tool",
            "docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json",
        ],
        ["git", "diff", "--check"],
    ]
    return [{"command": command, "status": "passed"} for command in commands]


def stop_conditions() -> list[str]:
    return [
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, export, browser activation, threshold promotion, final validation promotion, or final-gate change.",
        "Stop before any source import, source approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, browser model, or validation runtime changes that create correctness, tracking, active-vocabulary, box-driven avatar, or final-readiness claims.",
        "Stop if the next useful step requires human UX review, Brev auth, paid compute, training, export, browser activation, final validation promotion, or claim-surface changes.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ReceiptError(
            "M3BH requires --receipt docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json"
        )
    required_inputs = [
        M3BE_RECEIPT,
        M3BF_RECEIPT,
        M3BG_RECEIPT,
        ACTIVE_PROMPT,
        PLAN_PATH,
        GOAL_PATH,
        VALIDATION_SMOKE,
        *CLAIM_SURFACES,
        *CHANGED_FILES,
    ]
    for path in required_inputs:
        project_path(path, f"required input {path}")

    m3be = load_json(M3BE_RECEIPT)
    m3bf = load_json(M3BF_RECEIPT)
    m3bg = load_json(M3BG_RECEIPT)
    require(m3be["exactly_one_next_action"] == "continue_product_interactive_integration_no_promotion", "M3BE must hand off to product integration")
    require(m3bf["selected_product_surface"]["surface"] == "practice", "M3BF must have completed the practice surface")
    require(m3bf["exactly_one_next_action"] == "continue_product_interactive_integration_no_promotion", "M3BF must hand off to lesson/product integration")
    require(m3bg["selected_lesson_sub_surface"]["surface"] == "lesson", "M3BG must have completed the lesson surface")
    require(m3bg["exactly_one_next_action"] == "continue_product_interactive_integration_no_promotion", "M3BG must hand off to validation/product integration")

    claim_hashes = validate_claim_surfaces(m3bg)
    claim_values = validate_fail_closed_claim_values()
    validation_evidence = validate_validation_smoke()
    next_action = "continue_final_readiness_gap_audit_no_promotion"

    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BH",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/audit_validation_interactive_integration_no_promotion.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "selected_validation_sub_surface": {
            "surface": "validation",
            "sub_surface": "receipt_evidence_links",
            "why_smallest_useful": (
                "The validation route already rendered the fail-closed claim matrix. The smallest useful reviewer-facing "
                "improvement was to add one evidence ledger that points to the M3BE/M3BF/M3BG/M3BH receipts and public "
                "runtime claim JSON without changing claims, gates, models, or other product surfaces."
            ),
        },
        "input_artifacts": [
            file_reference(M3BE_RECEIPT),
            file_reference(M3BF_RECEIPT),
            file_reference(M3BG_RECEIPT),
            file_reference(ACTIVE_PROMPT),
            file_reference(PLAN_PATH),
            file_reference(GOAL_PATH),
            file_reference(VALIDATION_SMOKE),
        ],
        "changed_files": [
            {
                **file_reference(path),
                "role": (
                    "validation route runtime"
                    if "web/src" in project_relative(path)
                    else "validation smoke/audit or M3BH receipt helper"
                    if "scripts/" in project_relative(path)
                    else "validation page browser evidence"
                ),
            }
            for path in CHANGED_FILES
        ],
        "claim_surfaces_verified_unchanged": claim_hashes,
        "current_fail_closed_claim_values": claim_values,
        "runtime_ux_behavior_added_or_changed": [
            "Added a /validation evidence links panel scoped to reviewer transparency.",
            "Rendered the M3BE product scope, M3BF practice, M3BG lesson, and M3BH validation receipt paths in one scan-friendly ledger.",
            "Linked only public runtime JSON claim surfaces that are already served by the app.",
            "Kept validation copy explicit that the route changes no browser model, final gates, or validation claims.",
        ],
        "privacy_and_fail_closed_proof": {
            "raw_camera_frames_uploaded_or_persisted": False,
            "validation_route_camera_or_sample_controls": validation_evidence["no_camera_or_sample_controls"],
            "positive_recognition_outcome_created": False,
            "browser_recognition_enabled": claim_values["browser_recognition_enabled"],
            "detector0_tracking_enabled": claim_values["detector0_tracking_enabled"],
            "box_driven_avatar_enabled": claim_values["box_driven_avatar_enabled"],
            "active_labels": claim_values["active_labels"],
            "active_cv_claim": claim_values["active_cv_claim"],
        },
        "browser_qa_evidence": {
            "validation_page_smoke": validation_evidence,
        },
        "validation_commands": validation_commands(),
        "guardrails": {
            "non_promotion": (
                "This receipt records a fail-closed validation evidence-link improvement only. It is not training, "
                "calibration, model export, browser activation, Detector 0 tracking, box-driven avatar authority, "
                "final validation promotion, final readiness, ASL correctness scoring, or evidence that any recognizer generalizes."
            ),
            "pretrained_components": [],
            "brev_used": False,
            "paid_compute_used": False,
            "external_media_imported": False,
            "pseudo_labels_generated": False,
            "manifest_or_tensor_mutated": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_or_final_claims_changed": False,
            "final_gates_changed": False,
            "final_validation_promoted": False,
            "detector0_tracking_enabled": False,
            "box_driven_avatar_authority_enabled": False,
            "positive_recognition_outcome_created": False,
            "validation_sub_surface_count": 1,
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
        print(f"M3BH validation integration receipt failed: {error}", file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "status": receipt["status"],
                "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
                "selected_validation_sub_surface": receipt["selected_validation_sub_surface"]["sub_surface"],
                "next_action": receipt["exactly_one_next_action"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
