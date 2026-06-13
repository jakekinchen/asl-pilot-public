#!/usr/bin/env python3
"""Build the Mission 3BL SemLex source-register candidate no-import artifact."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_PATH = PROJECT_ROOT / "docs" / "research" / "semlex-source-register-candidate-no-import-v1.json"
SCHEMA_VERSION = "asl-pilot-semlex-source-register-candidate-no-import/v1"
EXACTLY_ONE_NEXT_ACTION = "escalate_strategy_research"

GOAL_PATH = PROJECT_ROOT / "GOAL.md"
ACTIVE_PROMPT = (
    PROJECT_ROOT
    / "docs"
    / "model"
    / "return-to-form-semlex-source-register-candidate-no-import-goal-loop-prompt.md"
)
PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md"
TRAINING_PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "dataset-and-training-plan.md"
SOURCE_REGISTER_PATH = PROJECT_ROOT / "docs" / "model" / "dataset-source-register.json"
SUPPORTED_LABEL_REGISTRY_PATH = PROJECT_ROOT / "docs" / "validation" / "supported-label-registry.json"
ACTIVE_VOCABULARY_CLAIM_PATH = PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json"
M3BK_REVIEW_PATH = PROJECT_ROOT / "docs" / "research" / "semlex-asl-lex-overlap-source-review-v1.json"
M3BK_LOG_PATH = PROJECT_ROOT / "docs" / "session-logs" / "354-mission-3bk-semlex-overlap-source-review.md"
DATA_QUALITY_RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-data-quality-contract-v1.json"
DETECTOR0_RECEIPT_PATH = (
    PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json"
)

CLAIM_SURFACES = [
    PROJECT_ROOT / "web" / "public" / "model" / "model-card.json",
    PROJECT_ROOT / "web" / "public" / "model" / "claim-matrix.json",
    ACTIVE_VOCABULARY_CLAIM_PATH,
    PROJECT_ROOT / "docs" / "validation" / "final-claim-matrix.json",
    PROJECT_ROOT / "web" / "public" / "model" / "browser-model-bundle.json",
    PROJECT_ROOT / "web" / "public" / "model" / "detector0-card.json",
]

INPUT_PATHS = [
    GOAL_PATH,
    ACTIVE_PROMPT,
    PLAN_PATH,
    TRAINING_PLAN_PATH,
    SOURCE_REGISTER_PATH,
    SUPPORTED_LABEL_REGISTRY_PATH,
    ACTIVE_VOCABULARY_CLAIM_PATH,
    M3BK_REVIEW_PATH,
    M3BK_LOG_PATH,
    DATA_QUALITY_RECEIPT_PATH,
    DETECTOR0_RECEIPT_PATH,
]


class CandidateError(RuntimeError):
    """Raised when the M3BL artifact cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--artifact",
        type=Path,
        default=Path("docs/research/semlex-source-register-candidate-no-import-v1.json"),
        help="Tracked M3BL candidate artifact path.",
    )
    parser.add_argument("--write-artifact", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise CandidateError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise CandidateError(f"{context} missing: {path}")
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
        raise CandidateError(message)


def source_by_id(source_register: dict[str, Any], source_id: str) -> dict[str, Any] | None:
    for source in source_register.get("sources", []):
        if source.get("source_id") == source_id:
            return source
    return None


def semlex_entries(source_register: dict[str, Any]) -> list[dict[str, Any]]:
    entries = []
    for source in source_register.get("sources", []):
        source_id = str(source.get("source_id", "")).lower()
        display_name = str(source.get("display_name", "")).lower()
        if "semlex" in source_id or "semlex" in display_name:
            entries.append(source)
    return entries


def source_register_status(source_register: dict[str, Any]) -> dict[str, Any]:
    asl_lex = source_by_id(source_register, "asl-lex")
    require(asl_lex is not None, "source register must contain asl-lex")
    entries = semlex_entries(source_register)
    require(asl_lex.get("allowed_for_model_training") is False, "ASL-LEX training use must remain blocked")
    require(not entries, "SemLex unexpectedly exists in the source register")

    return {
        "asl_lex": {
            "source_id": asl_lex["source_id"],
            "display_name": asl_lex["display_name"],
            "allowed_for_model_training": asl_lex["allowed_for_model_training"],
            "allowed_for_validation": asl_lex["allowed_for_validation"],
            "allowed_for_pilot_submission": asl_lex["allowed_for_pilot_submission"],
            "license_review_status": asl_lex["license_review_status"],
            "decision_id": asl_lex["decision_id"],
            "exact_video_training_blocker": "sign reference videos are excluded from the current database/visualization license allowance and require explicit permission for video use",
            "primary_source_url": asl_lex.get("primary_source_url"),
            "restrictions": asl_lex.get("restrictions", []),
            "source_evidence": asl_lex.get("source_evidence", []),
        },
        "semlex": {
            "present_in_source_register": False,
            "entry_count": 0,
            "entries": [],
            "exact_register_blocker": "no SemLex source-register entry or repo-local SemLex artifact exists",
        },
        "default_public_dataset_policy": source_register.get("review_method", {}).get("default_public_dataset_policy"),
    }


def current_fail_closed_claim_values() -> dict[str, Any]:
    model_card = load_json(CLAIM_SURFACES[0])
    public_claim_matrix = load_json(CLAIM_SURFACES[1])
    active_vocab = load_json(CLAIM_SURFACES[2])
    final_claim_matrix = load_json(CLAIM_SURFACES[3])
    browser_bundle = load_json(CLAIM_SURFACES[4])
    detector_card = load_json(CLAIM_SURFACES[5])

    require(model_card["status"] == "not_trained", "model-card status must stay not_trained")
    require(active_vocab["activeLabels"] == [], "active vocabulary must stay empty")
    require(public_claim_matrix.get("active_cv_claim") is None, "public claim matrix must not have active_cv_claim")
    require(final_claim_matrix.get("active_cv_claim") is None, "final claim matrix must not have active_cv_claim")
    require(browser_bundle["recognition"]["enabled"] is False, "browser recognition must stay disabled")
    require(browser_bundle["detector0_tracking"]["enabled"] is False, "Detector 0 tracking must stay disabled")
    require(browser_bundle["box_driven_avatar"]["enabled"] is False, "box-driven avatar must stay disabled")
    require(detector_card["status"] == "not_trained", "Detector 0 card must stay not_trained")

    return {
        "model_card_status": model_card["status"],
        "active_vocabulary_model_version": active_vocab["modelVersion"],
        "active_labels": active_vocab["activeLabels"],
        "active_cv_claim": final_claim_matrix["active_cv_claim"],
        "public_claim_matrix_status": public_claim_matrix["status"],
        "browser_recognition_enabled": browser_bundle["recognition"]["enabled"],
        "detector0_status": detector_card["status"],
        "detector0_tracking_enabled": browser_bundle["detector0_tracking"]["enabled"],
        "box_driven_avatar_enabled": browser_bundle["box_driven_avatar"]["enabled"],
    }


def validate_source_text() -> dict[str, Any]:
    goal_text = GOAL_PATH.read_text(encoding="utf-8")
    prompt_text = ACTIVE_PROMPT.read_text(encoding="utf-8")
    plan_text = PLAN_PATH.read_text(encoding="utf-8")

    require("Mission 3BL" in goal_text, "GOAL.md must name Mission 3BL")
    require(project_relative(ACTIVE_PROMPT) in goal_text, "GOAL.md must point at the M3BL prompt")
    require(project_relative(ARTIFACT_PATH) in goal_text, "GOAL.md must name the M3BL artifact")
    require(project_relative(ARTIFACT_PATH) in prompt_text, "active prompt must name the M3BL artifact")
    require("final SemLex / ASL-LEX source-paperwork pass" in goal_text, "GOAL.md must record M3BL completion bias")
    require("M3BL" in plan_text and project_relative(ACTIVE_PROMPT) in plan_text, "plan must name M3BL prompt")
    require(EXACTLY_ONE_NEXT_ACTION in prompt_text, "active prompt must allow selected next action")
    return {
        "goal_names_mission_3bl": True,
        "goal_points_at_active_prompt": True,
        "goal_names_expected_artifact": True,
        "active_prompt_names_expected_artifact": True,
        "m3bl_completion_bias_recorded": True,
        "plan_names_m3bl_prompt": True,
    }


def m3bk_summary(review: dict[str, Any]) -> dict[str, Any]:
    require(review["status"] == "completed_candidate_source_gap_reviewed", "M3BK review must be completed")
    require(
        review["exactly_one_next_action"] == "continue_semlex_source_register_candidate_no_import",
        "M3BK review must hand off to M3BL",
    )
    overlap = review["vocabulary_overlap_results"]
    method = review["vocabulary_overlap_method"]
    return {
        "status": review["status"],
        "selected_next_action": review["exactly_one_next_action"],
        "content_vocabulary_count": overlap["content_vocabulary_count"],
        "local_external_artifact_count": len(method["local_external_artifacts"]),
        "local_external_term_count": overlap["local_external_term_count"],
        "matched_content_vocabulary_count": overlap["matched_content_vocabulary_count"],
        "semlex_present_in_source_register": review["source_register_status"]["semlex"]["present_in_source_register"],
        "asl_lex_license_review_status": review["source_register_status"]["asl_lex"]["license_review_status"],
    }


def route_context(data_quality: dict[str, Any], detector0: dict[str, Any]) -> dict[str, Any]:
    require(data_quality["candidate_subset"]["training_worthy_subset_identified"] is False, "data quality contract unexpectedly found a training-worthy subset")
    require(detector0["next_action"]["id"] == "stop_reduced_claim", "Detector 0 receipt must remain reduced-claim stop")
    return {
        "data_quality": {
            "status": data_quality["candidate_subset"]["status"],
            "training_worthy_subset_identified": data_quality["candidate_subset"]["training_worthy_subset_identified"],
            "smallest_honest_candidate_subset": data_quality["candidate_subset"]["smallest_honest_candidate_subset"],
            "relevant_conclusions": data_quality.get("contract_conclusions", [])[:4],
        },
        "detector0": {
            "status": detector0["status"],
            "next_action": detector0["next_action"]["id"],
            "readiness_classification": detector0["readiness_classification"]["classification"],
            "data_or_schema_invalidation_found": detector0["readiness_classification"]["data_or_schema_invalidation_found"],
        },
    }


def build_artifact(artifact_path: Path) -> dict[str, Any]:
    resolved_artifact_path = project_path(artifact_path, "artifact path", must_exist=False)
    source_register = load_json(SOURCE_REGISTER_PATH)
    supported_label_registry = load_json(SUPPORTED_LABEL_REGISTRY_PATH)
    active_vocabulary_claim = load_json(ACTIVE_VOCABULARY_CLAIM_PATH)
    m3bk_review = load_json(M3BK_REVIEW_PATH)
    data_quality = load_json(DATA_QUALITY_RECEIPT_PATH)
    detector0 = load_json(DETECTOR0_RECEIPT_PATH)

    source_status = source_register_status(source_register)
    m3bk = m3bk_summary(m3bk_review)
    context = route_context(data_quality, detector0)

    require(supported_label_registry["cv_supported_labels"] == [], "supported labels must remain empty")
    require(active_vocabulary_claim["activeLabels"] == [], "active labels must remain empty")
    require(m3bk["local_external_artifact_count"] == 0, "M3BK unexpectedly found a local SemLex/ASL-LEX artifact")
    require(m3bk["matched_content_vocabulary_count"] == 0, "M3BK unexpectedly established content vocabulary overlap")

    concrete_surface_exists = False
    artifact = {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BL - SemLex source-register candidate no-import",
        "status": "completed_no_usable_semlex_candidate_surface",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "generated_by": {
            "tool": project_relative(Path(__file__).resolve()),
            "script": file_reference(Path(__file__).resolve()),
            "command": [
                sys.executable,
                project_relative(Path(__file__).resolve()),
                "--artifact",
                project_relative(resolved_artifact_path),
                "--write-artifact",
            ],
        },
        "source_of_truth_validation": validate_source_text(),
        "input_artifacts": [file_reference(path) for path in INPUT_PATHS],
        "claim_surfaces": [file_reference(path) for path in CLAIM_SURFACES],
        "current_fail_closed_claim_values": current_fail_closed_claim_values(),
        "m3bk_review_status": m3bk,
        "source_register_status": source_status,
        "candidate_source_register_proposal": {
            "proposal_type": "negative_candidate_boundary_no_register_edit",
            "concrete_repo_local_non_media_metadata_or_phonology_surface_exists": concrete_surface_exists,
            "semlex_candidate_entry_proposed_for_register_edit": False,
            "asl_lex_candidate_entry_proposed_for_register_edit": False,
            "why_no_register_candidate_is_safe_now": [
                "M3BK found no repo-local SemLex/ASL-LEX/phonology artifact.",
                "SemLex has no current source-register entry.",
                "ASL-LEX videos remain blocked by explicit current register restrictions.",
                "The source register already has a blocked ASL-LEX entry, but no repo-local non-media metadata or phonology payload exists to bind to a new no-import candidate.",
            ],
            "candidate_only_boundary_if_revisited_later": {
                "scope": "non-media metadata or phonology vocabulary research only",
                "minimum_required_before_any_register_edit": [
                    "human source/legal approval for the exact non-media source terms",
                    "repo-local artifact containing allowed non-media metadata or phonology fields",
                    "explicit exclusion of reference videos and any media download",
                    "explicit exclusion of validation, training, pilot claims, and browser activation",
                ],
                "not_allowed_to_infer": [
                    "that ASL-LEX videos are usable",
                    "that SemLex is approved",
                    "that metadata overlap creates source approval",
                    "that any recognizer training, validation, or pilot claim is ready",
                ],
            },
        },
        "allowed_uses": [
            "cite the current blocked ASL-LEX source-register status",
            "cite that SemLex is absent from the source register",
            "use this artifact as evidence to stop the current SemLex paperwork loop",
            "perform a later strategy research pass that compares non-source routes without importing media",
        ],
        "prohibited_uses": [
            "editing docs/model/dataset-source-register.json from this artifact",
            "downloading, saving, displaying, or training on ASL-LEX reference videos",
            "using SemLex or ASL-LEX for validation, training, pilot evidence, or browser claims",
            "treating candidate metadata or phonology notes as source approval",
            "generating pseudo-labels, mutating manifests or tensors, launching Brev, exporting/promoting models, or changing final gates",
        ],
        "human_source_or_legal_approval_requirements": {
            "required_before_source_register_edit": True,
            "required_before_media_import_or_video_use": True,
            "required_before_validation_use": True,
            "required_before_training_use": True,
            "required_before_pilot_claim": True,
            "not_required_to_close_this_no_import_artifact": True,
        },
        "route_decision_context": context,
        "next_action_assessment": [
            {
                "action": "continue_semlex_metadata_vocab_artifact_no_import",
                "selected": False,
                "reason": "Rejected by M3BL completion bias: no concrete existing repo-local non-media metadata or phonology surface exists.",
            },
            {
                "action": "continue_vocab_data_repair_no_training",
                "selected": False,
                "reason": "M3BD found no current training-worthy subset and says manual/source/data repair would need explicit approval before training relevance.",
            },
            {
                "action": "continue_detector0_annotation_or_schema_repair_no_brev",
                "selected": False,
                "reason": "The latest Detector 0 microprobe selected stop_reduced_claim and did not identify a bounded no-new-source Detector 0 path justified by current evidence.",
            },
            {
                "action": EXACTLY_ONE_NEXT_ACTION,
                "selected": True,
                "reason": "The SemLex source route is exhausted locally, and choosing among source, vocabulary/data, and Detector 0/model routes remains high-risk after multiple audited failures.",
            },
        ],
        "non_promotion_statement": (
            "This artifact is a negative no-import source-register candidate proposal. "
            "It is not source approval, a source-register edit, media import, validation "
            "use, training use, training readiness, browser readiness, final validation, "
            "model promotion, or an ASL correctness claim."
        ),
        "guardrails": {
            "source_register_edited": False,
            "source_approval_changed": False,
            "source_imported": False,
            "media_downloaded": False,
            "generated_pseudo_labels": False,
            "semlex_validation_or_training_use": False,
            "asl_lex_validation_or_training_use": False,
            "manifest_or_tensor_mutated": False,
            "brev_action": False,
            "paid_compute_used": False,
            "training_or_fitting_run": False,
            "checkpoint_created": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_activation": False,
            "final_validation_promoted": False,
            "final_gates_changed": False,
            "claim_surface_changed": False,
            "positive_recognition_outcome_created": False,
            "push": False,
        },
        "exactly_one_next_action": EXACTLY_ONE_NEXT_ACTION,
    }

    require(artifact["exactly_one_next_action"] == EXACTLY_ONE_NEXT_ACTION, "wrong next action")
    require(artifact["guardrails"]["source_register_edited"] is False, "source register must not be edited")
    require(artifact["guardrails"]["source_imported"] is False, "source import must remain false")
    require(artifact["guardrails"]["training_or_fitting_run"] is False, "training must remain false")
    require(artifact["candidate_source_register_proposal"]["concrete_repo_local_non_media_metadata_or_phonology_surface_exists"] is False, "candidate surface should be absent")
    return artifact


def main() -> int:
    args = parse_args()
    try:
        artifact_path = project_path(args.artifact, "artifact path", must_exist=False)
        artifact = build_artifact(artifact_path)
        if args.write_artifact:
            write_json(artifact_path, artifact)
        print(
            json.dumps(
                {
                    "status": "passed",
                    "artifact": project_relative(artifact_path),
                    "usable_semlex_candidate_surface": artifact["candidate_source_register_proposal"]["concrete_repo_local_non_media_metadata_or_phonology_surface_exists"],
                    "exactly_one_next_action": artifact["exactly_one_next_action"],
                    "source_register_edited": artifact["guardrails"]["source_register_edited"],
                    "training_or_fitting_run": artifact["guardrails"]["training_or_fitting_run"],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except CandidateError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
