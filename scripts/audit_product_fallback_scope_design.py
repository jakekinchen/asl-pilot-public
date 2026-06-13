#!/usr/bin/env python3
"""Build the Mission 3BE no-training product fallback scope design receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-product-fallback-scope-design-v1.json"
SCHEMA_VERSION = "asl-pilot-product-fallback-scope-design/v1"
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-data-quality-contract-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "338-mission-3bd-data-quality-contract.md",
    PROJECT_ROOT / "web" / "public" / "model" / "model-card.json",
    PROJECT_ROOT / "web" / "public" / "model" / "claim-matrix.json",
    PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    PROJECT_ROOT / "docs" / "validation" / "final-claim-matrix.json",
    PROJECT_ROOT / "web" / "public" / "model" / "browser-model-bundle.json",
    PROJECT_ROOT / "web" / "public" / "model" / "detector0-card.json",
    PROJECT_ROOT / "docs" / "validation" / "lesson-page-smoke.json",
    PROJECT_ROOT / "docs" / "validation" / "practice-camera-behavior-smoke.json",
    PROJECT_ROOT / "docs" / "validation" / "practice-progress-smoke.json",
    PROJECT_ROOT / "docs" / "validation" / "practice-scope-copy-smoke.json",
    PROJECT_ROOT / "docs" / "validation" / "browser-onnx-wiring-smoke.json",
    PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md",
]


class DesignError(RuntimeError):
    """Raised when the product fallback scope design cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-product-fallback-scope-design-v1.json"),
        help="Tracked M3BE receipt path.",
    )
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DesignError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise DesignError(f"{context} missing: {path}")
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


def checks_by_id(receipt: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(check.get("id")): check for check in receipt.get("checks", [])}


def passed_check_ids(receipt: dict[str, Any]) -> list[str]:
    return [
        str(check.get("id"))
        for check in receipt.get("checks", [])
        if check.get("status") == "passed"
    ]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise DesignError(message)


def stop_conditions() -> list[str]:
    return [
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute unless a bounded compute-receipt prompt is active and human approval is current.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, export, browser activation, final-readiness claim, threshold promotion, or final-gate change.",
        "Stop before any source import, source-approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, product-runtime, or browser model changes that create correctness, tracking, active-vocabulary, or final-readiness claims.",
        "Stop if the next product implementation requires a human UX/content choice outside the bounded fail-closed scope in this design.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise DesignError(
            "M3BE requires --receipt docs/validation/return-to-form-product-fallback-scope-design-v1.json"
        )
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    m3bd = load_json(INPUT_ARTIFACTS[0])
    model_card = load_json(INPUT_ARTIFACTS[2])
    public_claim_matrix = load_json(INPUT_ARTIFACTS[3])
    active_vocab = load_json(INPUT_ARTIFACTS[4])
    final_claim_matrix = load_json(INPUT_ARTIFACTS[5])
    browser_bundle = load_json(INPUT_ARTIFACTS[6])
    detector_card = load_json(INPUT_ARTIFACTS[7])
    lesson_smoke = load_json(INPUT_ARTIFACTS[8])
    practice_camera = load_json(INPUT_ARTIFACTS[9])
    practice_progress = load_json(INPUT_ARTIFACTS[10])
    practice_scope_copy = load_json(INPUT_ARTIFACTS[11])
    browser_onnx_smoke = load_json(INPUT_ARTIFACTS[12])

    require(m3bd["candidate_subset"]["training_worthy_subset_identified"] is False, "M3BD must rule out training")
    require(model_card["status"] == "not_trained", "model card must remain not_trained")
    require(public_claim_matrix["status"] == "no_active_claim_rawframe_not_trained", "public claim matrix must fail closed")
    require(final_claim_matrix["status"] == "no_active_claim_rawframe_not_trained", "docs claim matrix must fail closed")
    require(public_claim_matrix.get("active_cv_claim") is None, "public claim matrix must have no active CV claim")
    require(final_claim_matrix.get("active_cv_claim") is None, "docs claim matrix must have no active CV claim")
    require(active_vocab["modelVersion"] == "rawframe-not-trained", "active vocabulary model version must be rawframe-not-trained")
    require(active_vocab["activeLabels"] == [], "active vocabulary labels must stay empty")
    require(browser_bundle["recognition"]["enabled"] is False, "browser recognition must stay disabled")
    require(browser_bundle["detector0_tracking"]["enabled"] is False, "Detector 0 tracking must stay disabled")
    require(browser_bundle["box_driven_avatar"]["enabled"] is False, "box-driven avatar must stay disabled")
    require(detector_card["status"] == "not_trained", "Detector 0 card must stay not_trained")

    lesson_checks = checks_by_id(lesson_smoke)
    practice_camera_checks = checks_by_id(practice_camera)
    practice_progress_checks = checks_by_id(practice_progress)
    scope_copy_checks = checks_by_id(practice_scope_copy)
    next_action = "continue_product_interactive_integration_no_promotion"
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BE",
        "active_prompt": "docs/model/return-to-form-product-fallback-scope-design-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/audit_product_fallback_scope_design.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "input_artifacts": [file_reference(path) for path in INPUT_ARTIFACTS],
        "commands": {
            "design_generation": [sys.executable, *sys.argv],
            "json_validation": [
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "docs/validation/return-to-form-product-fallback-scope-design-v1.json",
                ]
            ],
            "required_audits": [
                ["node", "scripts/audit_loop_premise.mjs", "--json"],
                ["node", "scripts/audit_return_to_form_plan.mjs", "--json"],
                ["node", "scripts/audit_no_pretrained_deps.mjs"],
                ["node", "scripts/audit_no_pretrained_artifact_json.mjs"],
                ["python3", "-m", "json.tool", "docs/validation/return-to-form-data-quality-contract-v1.json"],
                ["python3", "-m", "py_compile", "scripts/audit_product_fallback_scope_design.py"],
                ["node", "scripts/audit_final_claim_matrix.mjs"],
                ["node", "scripts/audit_lesson_fail_closed.mjs"],
                ["node", "scripts/audit_avatar_no_recognition_claims.mjs"],
                ["node", "scripts/audit_practice_screen_contract.mjs"],
                ["node", "scripts/audit_lesson_page_smoke.mjs"],
                ["node", "scripts/audit_practice_camera_behavior_smoke.mjs"],
                ["node", "scripts/audit_practice_progress_smoke.mjs"],
                ["node", "scripts/audit_practice_scope_copy_smoke.mjs"],
                ["node", "scripts/audit_browser_onnx_wiring_smoke.mjs"],
                ["git", "diff", "--check"],
            ],
        },
        "method": {
            "training_or_fitting_performed": False,
            "model_loaded_or_checkpoint_created": False,
            "optimizer_or_backward_used": False,
            "brev_used": False,
            "source_imported": False,
            "manifest_or_tensor_mutated": False,
            "product_runtime_changed": False,
            "browser_or_final_claim_changed": False,
            "description": (
                "Loaded existing data-quality, claim, model-card, browser-bundle, Detector 0, and product-smoke "
                "artifacts; verified current fail-closed status; recorded a product fallback scope design without "
                "runtime edits, claim changes, training, Brev, export, or final-gate changes."
            ),
        },
        "m3bd_data_quality_summary": {
            "receipt_status": m3bd["status"],
            "candidate_subset_status": m3bd["candidate_subset"]["status"],
            "training_worthy_subset_identified": m3bd["candidate_subset"]["training_worthy_subset_identified"],
            "smallest_honest_candidate_subset": m3bd["candidate_subset"]["smallest_honest_candidate_subset"],
            "selected_next_action": m3bd["exactly_one_next_action"],
        },
        "current_browser_model_claim_status": {
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
            "authored_avatar_demos_enabled": browser_bundle["authored_avatar_demos"]["enabled"],
        },
        "existing_product_evidence": {
            "lesson_page_smoke": {
                "status": lesson_smoke["status"],
                "passed_checks": passed_check_ids(lesson_smoke),
                "fail_closed_payload": lesson_checks.get("camera_local_sample", {}).get("evidence", {}),
                "robot_mode": lesson_checks.get("avatar_demo_mode", {}).get("evidence", {}),
            },
            "practice_camera_behavior_smoke": {
                "status": practice_camera["status"],
                "passed_checks": passed_check_ids(practice_camera),
                "fail_closed_attempt_visible": practice_camera_checks.get(
                    "camera_success_attempt_result_and_progress", {}
                ).get("evidence", {}),
            },
            "practice_progress_smoke": {
                "status": practice_progress["status"],
                "passed_checks": passed_check_ids(practice_progress),
                "raw_payload_rejected": practice_progress_checks.get("raw_payload_rejected", {}).get("evidence", {}),
                "metadata_attempt_fail_closed": practice_progress_checks.get(
                    "metadata_attempt_fail_closed", {}
                ).get("evidence", {}),
                "dataset_collection_default_disabled": practice_progress_checks.get(
                    "dataset_collection_default_disabled", {}
                ).get("evidence", {}),
            },
            "practice_scope_copy_smoke": {
                "status": practice_scope_copy["status"],
                "boundary": practice_scope_copy["boundary"],
                "passed_checks": passed_check_ids(practice_scope_copy),
                "copy_boundary_evidence": {
                    "auth_prompt_catalog_boundary": scope_copy_checks.get(
                        "auth_prompt_catalog_boundary", {}
                    ).get("evidence", {}),
                    "practice_prompt_catalog_boundary": scope_copy_checks.get(
                        "practice_prompt_catalog_boundary", {}
                    ).get("evidence", {}),
                },
            },
            "browser_onnx_wiring_smoke": {
                "status": browser_onnx_smoke["status"],
                "evidence_mode": browser_onnx_smoke["evidence_mode"],
                "finality": browser_onnx_smoke["finality"],
                "excluded_from_completion": browser_onnx_smoke["final_evidence_exclusion"][
                    "excluded_from_completion"
                ],
            },
        },
        "honest_learner_facing_fallback_scope": {
            "available_now_without_promotion": [
                "100-item prompt catalog as learn-only content, not active CV support.",
                "Local camera preview and local frame sampling for practice UX, with metadata-only attempt persistence.",
                "Fail-closed practice history and progress counts where attempts can increment but recognizer passes remain zero.",
                "Lesson studio with selected prompts, local-only camera preview, and a timing/demo robot scaffold with no tracking authority.",
                "Validation page and claim matrices that explain the not_trained browser state and missing final-readiness evidence.",
            ],
            "not_available_until_trained_artifact_exists": [
                "ASL correctness scoring or pass/fail recognition.",
                "Active vocabulary labels in docs/model/active-vocabulary-claim.json.",
                "Browser trained model activation, model-card promotion, ONNX export, or calibrated thresholds.",
                "Detector 0 tracking, box-driven avatar motion, or avatar correctness feedback.",
                "Final readiness, product-domain recognition, or commercial/public deployment claims.",
            ],
        },
        "product_surfaces": {
            "may_be_improved_without_promotion": [
                {
                    "surface": "practice",
                    "allowed": [
                        "practice flow ergonomics",
                        "progress/history presentation",
                        "local camera state and recovery UX",
                        "copy that reinforces learn-only/fail-closed status",
                    ],
                    "must_preserve": [
                        "no raw camera payload persistence",
                        "passed remains false while model_card.status is not_trained",
                        "active vocabulary remains empty",
                    ],
                },
                {
                    "surface": "lesson",
                    "allowed": [
                        "authored timing scaffolds",
                        "prompt study flow",
                        "robot demo/timing poses with recognitionAuthority false",
                        "camera preview ergonomics",
                    ],
                    "must_preserve": [
                        "Detector 0 unavailable copy",
                        "no tracking active claim",
                        "no ASL correctness or pass/fail feedback",
                    ],
                },
                {
                    "surface": "validation",
                    "allowed": [
                        "clearer reviewer-facing gap inventory",
                        "links to existing receipts",
                        "claim-matrix readability",
                    ],
                    "must_preserve": [
                        "no active CV claim",
                        "no final readiness claim",
                        "model card remains not_trained",
                    ],
                },
            ],
            "must_remain_unchanged_until_trained_artifact_exists": [
                "web/public/model/model-card.json status and trained activation fields",
                "web/public/model/claim-matrix.json active_cv_claim and label support",
                "docs/model/active-vocabulary-claim.json activeLabels and evidenceArtifacts",
                "docs/validation/final-claim-matrix.json final/readiness status",
                "web/public/model/browser-model-bundle.json recognition, Detector 0, and box-driven avatar gates",
            ],
        },
        "copy_ux_guardrails": [
            "Use learn-only, model inactive, not_trained, practice history, or timing/demo language.",
            "Do not use correct, passed, matched, tracking active, active vocabulary support, final readiness, calibrated, trained, or recognized language unless a promoted artifact exists.",
            "Every saved attempt while not_trained must communicate that automatic sign checking is unavailable and the attempt is practice history only.",
            "Robot/avatar language must describe authored timing/demo scaffolding, not live tracking or correctness.",
            "Prompt catalog copy must distinguish content coverage from recognition support.",
        ],
        "technical_gates_before_product_runtime_implementation_prompt": [
            {
                "gate": "bounded_fail_closed_scope",
                "status": "required_next",
                "requirement": (
                    "The next implementation prompt must name exact product surfaces and preserve model-card "
                    "not_trained status, activeLabels [], and active_cv_claim null."
                ),
            },
            {
                "gate": "claim_audits_after_any_runtime_change",
                "status": "required_next",
                "requirement": (
                    "Any product implementation must run final-claim, lesson fail-closed, avatar no-claim, "
                    "practice screen, relevant smoke receipt audits, typecheck, build, and browser QA as applicable."
                ),
            },
            {
                "gate": "local_privacy_boundary",
                "status": "passed_current_design",
                "requirement": "Raw camera frames must stay local; persisted attempts must remain metadata-only while not_trained.",
            },
            {
                "gate": "no_positive_recognition_outcomes",
                "status": "passed_current_design",
                "requirement": "Product runtime must not save passed=true from recognizer logic while model-card.status is not_trained.",
            },
        ],
        "technical_gates_before_future_ml_export_brev_or_final_readiness": [
            {
                "gate": "training_worthy_subset_or_human_repair",
                "status": "failed_current_design",
                "requirement": (
                    "M3BD currently has no retained labels. Future ML work needs a nonempty training-worthy subset "
                    "or explicit human-approved data/source/label repair."
                ),
            },
            {
                "gate": "bounded_compute_receipt_before_brev",
                "status": "blocked_current_design",
                "requirement": (
                    "Paid Brev work requires current auth, worker/cost/runtime/kill-condition/teardown receipt, "
                    "and no duplicate workers."
                ),
            },
            {
                "gate": "promoted_artifact_before_browser_activation",
                "status": "blocked_current_design",
                "requirement": (
                    "Browser activation requires trained scratch artifact, signer-disjoint metrics, negative "
                    "challenge results, model-card promotion, and final claim matrix update."
                ),
            },
            {
                "gate": "no_pretrained_promoted_lane",
                "status": "passed_current_design",
                "requirement": "Promoted recognition lane must keep pretrained_components empty.",
            },
        ],
        "contract_conclusions": [
            "The current honest product fallback is learn-only and fail-closed while recognition remains not_trained.",
            "Existing product receipts already prove local camera UX, metadata-only fail-closed practice history, lesson robot timing/demo scaffolding, and claim-matrix honesty.",
            "A bounded product implementation prompt is safe only if it preserves not_trained claims, activeLabels [], no active_cv_claim, no positive recognition outcomes, and no final-gate changes.",
            "Training, Brev, export, model-card promotion, browser trained activation, Detector 0 tracking, and final-readiness claims remain blocked.",
            f"The single next action is {next_action}.",
        ],
        "stop_conditions_requiring_human_approval": stop_conditions(),
        "blocked_actions_requiring_human_approval": [
            "Brev login, worker inspection, worker lifecycle changes, or paid compute without a compute-receipt prompt",
            "any training run, model fitting, optimizer/backward pass, checkpoint creation, or sweep",
            "source import, source approval expansion, generated pseudo-labels, or manual annotation/data collection",
            "manifest or tensor mutation",
            "Detector 0 or landmark revival",
            "ONNX export, model-card promotion, browser trained activation, final-readiness claim, or final-gate changes",
            "product-runtime implementation outside the bounded fail-closed scope in this design",
            "push",
        ],
        "guardrails": {
            "non_promotion": (
                "This product fallback scope design is not training, calibration, export, browser activation, final "
                "readiness, or evidence that the M3AW recognizer generalizes. The browser model remains "
                "not_trained/fail-closed."
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
            "product_runtime_changed": False,
        },
        "next_prompt_candidate": {
            "suggested_path": "docs/model/return-to-form-product-interactive-integration-no-promotion-goal-loop-prompt.md",
            "scope": (
                "One bounded product implementation slice that improves the fail-closed learner experience without "
                "changing model cards, claim matrices, active vocabulary, trained browser activation, export, "
                "Detector 0 tracking, final gates, or Brev state."
            ),
        },
        "exactly_one_next_action": next_action,
    }
    if args.write_receipt:
        write_json(receipt_path, receipt)
    return receipt


def main() -> int:
    args = parse_args()
    try:
        receipt = build_receipt(args)
    except DesignError as error:
        print(f"M3BE product fallback scope design failed: {error}", file=sys.stderr)
        return 2
    result = {
        "status": receipt["status"],
        "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
        "model_card_status": receipt["current_browser_model_claim_status"]["model_card_status"],
        "active_labels": receipt["current_browser_model_claim_status"]["active_labels"],
        "next_action": receipt["exactly_one_next_action"],
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
