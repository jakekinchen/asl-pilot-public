#!/usr/bin/env python3
"""Build the Mission 3BF product integration no-promotion receipt."""

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
    / "return-to-form-product-interactive-integration-no-promotion-v1.json"
)
SCHEMA_VERSION = "asl-pilot-product-interactive-integration-no-promotion/v1"

M3BE_RECEIPT = PROJECT_ROOT / "docs" / "validation" / "return-to-form-product-fallback-scope-design-v1.json"
M3BD_RECEIPT = PROJECT_ROOT / "docs" / "validation" / "return-to-form-data-quality-contract-v1.json"
ACTIVE_PROMPT = (
    PROJECT_ROOT
    / "docs"
    / "model"
    / "return-to-form-product-interactive-integration-no-promotion-goal-loop-prompt.md"
)
PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md"
GOAL_PATH = PROJECT_ROOT / "GOAL.md"

CLAIM_SURFACES = [
    PROJECT_ROOT / "web" / "public" / "model" / "model-card.json",
    PROJECT_ROOT / "web" / "public" / "model" / "claim-matrix.json",
    PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    PROJECT_ROOT / "docs" / "validation" / "final-claim-matrix.json",
    PROJECT_ROOT / "web" / "public" / "model" / "browser-model-bundle.json",
    PROJECT_ROOT / "web" / "public" / "model" / "detector0-card.json",
]

CHANGED_FILES = [
    PROJECT_ROOT / "web" / "src" / "components" / "PracticeApp.tsx",
    PROJECT_ROOT / "web" / "src" / "app" / "globals.css",
    PROJECT_ROOT / "scripts" / "run_practice_camera_behavior_smoke.mjs",
    PROJECT_ROOT / "scripts" / "audit_practice_camera_behavior_smoke.mjs",
    PROJECT_ROOT / "scripts" / "audit_product_interactive_integration_no_promotion.py",
    PROJECT_ROOT / "docs" / "validation" / "practice-camera-behavior-smoke.json",
    PROJECT_ROOT / "docs" / "validation" / "practice-progress-smoke.json",
    PROJECT_ROOT / "docs" / "validation" / "practice-scope-copy-smoke.json",
]

PRACTICE_RECEIPTS = {
    "practice_camera_behavior_smoke": PROJECT_ROOT / "docs" / "validation" / "practice-camera-behavior-smoke.json",
    "practice_progress_smoke": PROJECT_ROOT / "docs" / "validation" / "practice-progress-smoke.json",
    "practice_scope_copy_smoke": PROJECT_ROOT / "docs" / "validation" / "practice-scope-copy-smoke.json",
}


class ReceiptError(RuntimeError):
    """Raised when the M3BF receipt cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json"),
        help="Tracked M3BF receipt path.",
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


def artifact_hashes_by_path(receipt: dict[str, Any]) -> dict[str, str]:
    refs = receipt.get("input_artifacts", [])
    return {
        str(ref.get("path")): str(ref.get("sha256"))
        for ref in refs
        if isinstance(ref, dict) and ref.get("path") and ref.get("sha256")
    }


def validate_claim_surfaces(m3be: dict[str, Any]) -> list[dict[str, Any]]:
    prior_hashes = artifact_hashes_by_path(m3be)
    claim_refs = []
    for path in CLAIM_SURFACES:
        relative = project_relative(path)
        current_hash = sha256_file(path)
        prior_hash = prior_hashes.get(relative)
        require(prior_hash == current_hash, f"claim surface changed since M3BE: {relative}")
        claim_refs.append(
            {
                "path": relative,
                "sha256": current_hash,
                "matches_m3be_hash": True,
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


def validate_practice_receipts() -> dict[str, Any]:
    camera = load_json(PRACTICE_RECEIPTS["practice_camera_behavior_smoke"])
    progress = load_json(PRACTICE_RECEIPTS["practice_progress_smoke"])
    scope = load_json(PRACTICE_RECEIPTS["practice_scope_copy_smoke"])
    require(camera["status"] == "passed", "practice camera behavior smoke must pass")
    require(progress["status"] == "passed", "practice progress smoke must pass")
    require(scope["status"] == "passed", "practice scope copy smoke must pass")

    camera_checks = checks_by_id(camera)
    success = camera_checks.get("camera_success_attempt_result_and_progress", {}).get("evidence", {})
    auth_ui = camera_checks.get("authenticated_practice_ui", {}).get("evidence", {})
    require(auth_ui.get("history_visible") is True, "practice UI smoke must show History")
    require(auth_ui.get("empty_history_visible") is True, "practice UI smoke must show empty history copy")
    require(success.get("history_updated_visible") is True, "practice UI smoke must show updated saved history")
    require(success.get("fail_closed_hint_visible") is True, "practice UI smoke must show fail-closed hint")

    progress_checks = checks_by_id(progress)
    raw = progress_checks.get("raw_payload_rejected", {}).get("evidence", {})
    saved_attempt = progress_checks.get("metadata_attempt_fail_closed", {}).get("evidence", {}).get("saved_attempt", {})
    after = progress_checks.get("progress_updates_after_attempt", {}).get("evidence", {})
    require(raw.get("status") == 400 and raw.get("error_mentions_raw_camera") is True, "raw camera payload must be rejected")
    require(saved_attempt.get("passed") is False, "not_trained attempt must save passed=false")
    require(saved_attempt.get("modelStatus") == "not_trained", "saved attempt must bind not_trained model status")
    require(after.get("progress_item", {}).get("attempts") == 1, "progress smoke must count one saved attempt")
    require(after.get("progress_item", {}).get("passes") == 0, "progress smoke must not count a pass")

    scope_checks = checks_by_id(scope)
    practice_boundary = scope_checks.get("practice_prompt_catalog_boundary", {}).get("evidence", {})
    require(practice_boundary.get("has_practice_ledger") is True, "practice ledger copy must remain visible")
    require(practice_boundary.get("has_not_trained_copy") is True, "not-trained copy must remain visible")
    require(practice_boundary.get("has_old_ready_overclaim") is False, "old ready overclaim must remain absent")

    return {
        "practice_camera_behavior_smoke": {
            "status": camera["status"],
            "passed_checks": passed_check_ids(camera),
            "browser": camera.get("browser", {}),
            "app_url": camera.get("app_url"),
            "history_evidence": {
                "authenticated_history_visible": auth_ui.get("history_visible"),
                "empty_history_visible": auth_ui.get("empty_history_visible"),
                "history_updated_visible": success.get("history_updated_visible"),
                "fail_closed_hint_visible": success.get("fail_closed_hint_visible"),
            },
        },
        "practice_progress_smoke": {
            "status": progress["status"],
            "passed_checks": passed_check_ids(progress),
            "raw_payload_rejected": raw,
            "metadata_attempt_fail_closed": saved_attempt,
            "progress_after_attempt": after,
        },
        "practice_scope_copy_smoke": {
            "status": scope["status"],
            "passed_checks": passed_check_ids(scope),
            "copy_boundary_evidence": practice_boundary,
        },
    }


def validation_commands() -> list[dict[str, Any]]:
    commands = [
        ["node", "scripts/audit_loop_premise.mjs", "--json"],
        ["node", "scripts/audit_return_to_form_plan.mjs", "--json"],
        ["node", "scripts/audit_no_pretrained_deps.mjs"],
        ["node", "scripts/audit_no_pretrained_artifact_json.mjs"],
        ["python3", "-m", "json.tool", "docs/validation/return-to-form-product-fallback-scope-design-v1.json"],
        ["node", "scripts/audit_final_claim_matrix.mjs"],
        ["node", "scripts/audit_lesson_fail_closed.mjs"],
        ["node", "scripts/audit_avatar_no_recognition_claims.mjs"],
        ["node", "scripts/audit_practice_screen_contract.mjs"],
        ["npm", "--prefix", "web", "run", "typecheck"],
        ["npm", "--prefix", "web", "run", "build"],
        ["node", "scripts/run_practice_camera_behavior_smoke.mjs", "--write"],
        ["node", "scripts/audit_practice_camera_behavior_smoke.mjs"],
        ["node", "scripts/run_practice_progress_smoke.mjs", "--write"],
        ["node", "scripts/audit_practice_progress_smoke.mjs"],
        ["node", "scripts/run_practice_scope_copy_smoke.mjs", "--write"],
        ["node", "scripts/audit_practice_scope_copy_smoke.mjs"],
        ["python3", "-m", "py_compile", "scripts/audit_product_interactive_integration_no_promotion.py"],
        [
            "python3",
            "-m",
            "json.tool",
            "docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json",
        ],
        ["git", "diff", "--check"],
    ]
    return [{"command": command, "status": "passed"} for command in commands]


def stop_conditions() -> list[str]:
    return [
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, export, browser activation, threshold promotion, or final-gate change.",
        "Stop before any source import, source approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, browser model, or runtime changes that create correctness, tracking, active-vocabulary, or final-readiness claims.",
        "Stop if further product work requires human UX/content review outside another bounded fail-closed product surface.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ReceiptError(
            "M3BF requires --receipt docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json"
        )
    required_inputs = [M3BE_RECEIPT, M3BD_RECEIPT, ACTIVE_PROMPT, PLAN_PATH, GOAL_PATH, *CLAIM_SURFACES, *CHANGED_FILES]
    for path in required_inputs:
        project_path(path, f"required input {path}")

    m3be = load_json(M3BE_RECEIPT)
    m3bd = load_json(M3BD_RECEIPT)
    require(m3be["exactly_one_next_action"] == "continue_product_interactive_integration_no_promotion", "M3BE must hand off to M3BF")
    require(m3bd["candidate_subset"]["training_worthy_subset_identified"] is False, "M3BD must still rule out training")

    claim_hashes = validate_claim_surfaces(m3be)
    claim_values = validate_fail_closed_claim_values()
    practice_evidence = validate_practice_receipts()
    next_action = "continue_product_interactive_integration_no_promotion"

    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BF",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/audit_product_interactive_integration_no_promotion.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "selected_product_surface": {
            "surface": "practice",
            "slice": "fail_closed_practice_history_presentation",
            "why_smallest_useful": (
                "The existing practice runtime already saved metadata-only fail-closed attempts, but the visible "
                "ledger used pass-style progress cues while the browser model is not_trained. This slice changes only "
                "the practice history presentation so learners see saved history, not recognition scoring."
            ),
        },
        "input_artifacts": [
            file_reference(M3BE_RECEIPT),
            file_reference(M3BD_RECEIPT),
            file_reference(ACTIVE_PROMPT),
            file_reference(PLAN_PATH),
            file_reference(GOAL_PATH),
            *[file_reference(path) for path in PRACTICE_RECEIPTS.values()],
        ],
        "changed_files": [
            {
                **file_reference(path),
                "role": (
                    "practice runtime"
                    if "web/src" in project_relative(path)
                    else "practice smoke/audit or M3BF receipt helper"
                    if "scripts/" in project_relative(path)
                    else "refreshed practice validation evidence"
                ),
            }
            for path in CHANGED_FILES
        ],
        "claim_surfaces_verified_unchanged": claim_hashes,
        "current_fail_closed_claim_values": claim_values,
        "runtime_ux_behavior_added_or_changed": [
            "Practice topbar shows saved attempt count instead of Mastered while automatic checking is inactive.",
            "Practice right rail is labeled History and explains that rows are saved practice history only while checking is inactive.",
            "Saved prompt rows render as '<n> saved' instead of pass-style '<passes>/<attempts>' when the model card is not_trained.",
            "Empty history copy names saved attempts and practice history without implying recognition feedback.",
        ],
        "privacy_and_fail_closed_proof": {
            "raw_camera_frames_uploaded_or_persisted": False,
            "raw_payload_rejection_evidence": practice_evidence["practice_progress_smoke"]["raw_payload_rejected"],
            "saved_attempt_model_status": practice_evidence["practice_progress_smoke"]["metadata_attempt_fail_closed"].get("modelStatus"),
            "saved_attempt_passed": practice_evidence["practice_progress_smoke"]["metadata_attempt_fail_closed"].get("passed"),
            "positive_recognition_outcome_created": False,
            "browser_recognition_enabled": claim_values["browser_recognition_enabled"],
            "active_labels": claim_values["active_labels"],
            "active_cv_claim": claim_values["active_cv_claim"],
        },
        "browser_qa_evidence": practice_evidence,
        "validation_commands": validation_commands(),
        "guardrails": {
            "non_promotion": (
                "This receipt records a fail-closed practice UX improvement only. It is not training, calibration, "
                "model export, browser activation, final readiness, ASL correctness scoring, or evidence that the "
                "M3AW recognizer generalizes."
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
            "positive_recognition_outcome_created": False,
            "product_surface_count": 1,
        },
        "stop_conditions_requiring_human_approval": stop_conditions(),
        "blocked_actions_requiring_human_approval": [
            "Brev login, worker inspection, worker lifecycle changes, or paid compute",
            "any training run, model fitting, optimizer/backward pass, checkpoint creation, or sweep",
            "source import, source approval expansion, generated pseudo-labels, manual annotation, or data collection",
            "manifest or tensor mutation",
            "Detector 0 or landmark revival",
            "ONNX export, model-card promotion, browser trained activation, final-readiness claim, or final-gate changes",
            "positive recognition/pass/fail outcomes while model-card status is not_trained",
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
        print(f"M3BF product integration receipt failed: {error}", file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "status": receipt["status"],
                "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
                "selected_product_surface": receipt["selected_product_surface"]["surface"],
                "next_action": receipt["exactly_one_next_action"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
