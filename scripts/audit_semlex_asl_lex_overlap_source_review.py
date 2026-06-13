#!/usr/bin/env python3
"""Build the Mission 3BK SemLex / ASL-LEX overlap source review artifact."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REVIEW_PATH = PROJECT_ROOT / "docs" / "research" / "semlex-asl-lex-overlap-source-review-v1.json"
SCHEMA_VERSION = "asl-pilot-semlex-asl-lex-overlap-source-review/v1"
EXACTLY_ONE_NEXT_ACTION = "continue_semlex_source_register_candidate_no_import"

ACTIVE_PROMPT = (
    PROJECT_ROOT
    / "docs"
    / "model"
    / "return-to-form-semlex-overlap-source-review-no-training-goal-loop-prompt.md"
)
GOAL_PATH = PROJECT_ROOT / "GOAL.md"
PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "return-to-form-plan.md"
TRAINING_PLAN_PATH = PROJECT_ROOT / "docs" / "model" / "dataset-and-training-plan.md"
SOURCE_REGISTER_PATH = PROJECT_ROOT / "docs" / "model" / "dataset-source-register.json"
SUPPORTED_LABEL_REGISTRY_PATH = PROJECT_ROOT / "docs" / "validation" / "supported-label-registry.json"
ACTIVE_VOCABULARY_CLAIM_PATH = PROJECT_ROOT / "docs" / "model" / "active-vocabulary-claim.json"
VOCABULARY_TS_PATH = PROJECT_ROOT / "web" / "src" / "lib" / "vocabulary.ts"
M3BJ_RECEIPT_PATH = (
    PROJECT_ROOT
    / "docs"
    / "validation"
    / "return-to-form-post-review-ml-route-recovery-v1.json"
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
    VOCABULARY_TS_PATH,
    M3BJ_RECEIPT_PATH,
]


class ReviewError(RuntimeError):
    """Raised when the M3BK review cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--review",
        type=Path,
        default=Path("docs/research/semlex-asl-lex-overlap-source-review-v1.json"),
        help="Tracked M3BK source/overlap review artifact path.",
    )
    parser.add_argument("--write-review", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ReviewError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise ReviewError(f"{context} missing: {path}")
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
        raise ReviewError(message)


def normalize_term(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[_/\\-]+", " ", value)
    value = re.sub(r"[^a-z0-9 ]+", "", value)
    return re.sub(r"\s+", " ", value).strip()


def parse_vocabulary_items() -> list[dict[str, Any]]:
    text = VOCABULARY_TS_PATH.read_text(encoding="utf-8")
    seed_block_match = re.search(
        r"const VOCABULARY_SEEDS: VocabularySeed\[\] = \[(?P<body>.*?)\n\];",
        text,
        re.DOTALL,
    )
    require(seed_block_match is not None, "VOCABULARY_SEEDS block not found")
    seed_lines = re.findall(
        r'\[\s*"(?P<id>[^"]+)",\s*"(?P<label>[^"]+)",\s*"(?P<category>[^"]+)",',
        seed_block_match.group("body"),
    )
    require(seed_lines, "no vocabulary seed rows parsed")

    items: list[dict[str, Any]] = []
    for label_id, label, category in seed_lines:
        aliases = sorted({normalize_term(label_id), normalize_term(label)})
        items.append(
            {
                "id": label_id,
                "label": label,
                "category": category,
                "normalized_aliases": aliases,
            }
        )
    return items


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


def local_semlex_asl_lex_artifacts(review_path: Path) -> list[dict[str, Any]]:
    research_root = PROJECT_ROOT / "docs" / "research"
    if not research_root.exists():
        return []
    resolved_review_path = review_path.resolve()
    matches = []
    for path in sorted(research_root.iterdir(), key=lambda candidate: candidate.name):
        if not path.is_file() or path.resolve() == resolved_review_path:
            continue
        lower_name = path.name.lower()
        if "semlex" in lower_name or "asl-lex" in lower_name or "phonolog" in lower_name:
            matches.append(file_reference(path))
    return matches


def extract_local_external_terms(artifacts: list[dict[str, Any]]) -> list[dict[str, str]]:
    # Current repo has no SemLex/ASL-LEX/phonology artifacts. Keep the extractor
    # conservative for future reruns: only count explicit, normalized string-like
    # vocabulary keys from JSON artifacts, never media or source payloads.
    terms: dict[str, str] = {}
    for artifact in artifacts:
        path = PROJECT_ROOT / artifact["path"]
        if path.suffix.lower() != ".json":
            continue
        try:
            data = load_json(path)
        except json.JSONDecodeError:
            continue
        stack: list[Any] = [data]
        while stack:
            value = stack.pop()
            if isinstance(value, dict):
                for key, item in value.items():
                    if key.lower() in {"label", "label_id", "id", "gloss", "sign", "word"} and isinstance(item, str):
                        normalized = normalize_term(item)
                        if normalized:
                            terms[normalized] = item
                    else:
                        stack.append(item)
            elif isinstance(value, list):
                stack.extend(value)
    return [{"term": raw, "normalized": normalized} for normalized, raw in sorted(terms.items())]


def overlap_results(vocabulary_items: list[dict[str, Any]], external_terms: list[dict[str, str]]) -> dict[str, Any]:
    external_normalized = {term["normalized"] for term in external_terms}
    matches = []
    unmatched = []
    for item in vocabulary_items:
        aliases = set(item["normalized_aliases"])
        matched_aliases = sorted(aliases & external_normalized)
        if matched_aliases:
            matches.append(
                {
                    "id": item["id"],
                    "label": item["label"],
                    "matched_normalized_terms": matched_aliases,
                }
            )
        else:
            unmatched.append({"id": item["id"], "label": item["label"]})
    return {
        "content_vocabulary_count": len(vocabulary_items),
        "local_external_term_count": len(external_terms),
        "matched_content_vocabulary_count": len(matches),
        "unmatched_content_vocabulary_count": len(unmatched),
        "matches": matches,
        "unmatched_content_vocabulary": unmatched,
        "coverage_ratio": 0 if not vocabulary_items else len(matches) / len(vocabulary_items),
        "interpretation": (
            "No repo-local SemLex/ASL-LEX/phonology vocabulary artifact exists, "
            "so this review cannot establish source vocabulary coverage. The zero "
            "overlap is an evidence-gap result, not evidence that ASL-LEX or "
            "SemLex lacks these signs."
        )
        if not external_terms
        else "Matches are exact normalized alias matches against repo-local non-media artifacts only.",
    }


def current_fail_closed_claim_values() -> dict[str, Any]:
    model_card = load_json(CLAIM_SURFACES[0])
    public_claim_matrix = load_json(CLAIM_SURFACES[1])
    active_vocab = load_json(CLAIM_SURFACES[2])
    final_claim_matrix = load_json(CLAIM_SURFACES[3])
    browser_bundle = load_json(CLAIM_SURFACES[4])
    detector_card = load_json(CLAIM_SURFACES[5])

    require(model_card["status"] == "not_trained", "model-card status must remain not_trained")
    require(active_vocab["activeLabels"] == [], "active vocabulary must remain empty")
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


def source_register_status(source_register: dict[str, Any]) -> dict[str, Any]:
    asl_lex = source_by_id(source_register, "asl-lex")
    require(asl_lex is not None, "source register must contain asl-lex")
    require(asl_lex.get("allowed_for_model_training") is False, "ASL-LEX model training must remain blocked")
    entries = semlex_entries(source_register)

    return {
        "asl_lex": {
            "source_id": asl_lex["source_id"],
            "display_name": asl_lex["display_name"],
            "allowed_for_model_training": asl_lex["allowed_for_model_training"],
            "allowed_for_validation": asl_lex["allowed_for_validation"],
            "allowed_for_pilot_submission": asl_lex["allowed_for_pilot_submission"],
            "license_review_status": asl_lex["license_review_status"],
            "decision_id": asl_lex["decision_id"],
            "primary_source_url": asl_lex.get("primary_source_url"),
            "video_use_currently_allowed_for_model_training": False,
            "restrictions": asl_lex.get("restrictions", []),
            "source_evidence": asl_lex.get("source_evidence", []),
        },
        "semlex": {
            "present_in_source_register": bool(entries),
            "entry_count": len(entries),
            "entries": [
                {
                    "source_id": entry.get("source_id"),
                    "display_name": entry.get("display_name"),
                    "allowed_for_model_training": entry.get("allowed_for_model_training"),
                    "license_review_status": entry.get("license_review_status"),
                    "decision_id": entry.get("decision_id"),
                }
                for entry in entries
            ],
        },
        "default_public_dataset_policy": source_register.get("review_method", {}).get("default_public_dataset_policy"),
    }


def validate_source_text() -> dict[str, Any]:
    goal_text = GOAL_PATH.read_text(encoding="utf-8")
    prompt_text = ACTIVE_PROMPT.read_text(encoding="utf-8")
    training_plan_text = TRAINING_PLAN_PATH.read_text(encoding="utf-8")
    m3bj_receipt = load_json(M3BJ_RECEIPT_PATH)

    require("Mission 3BK" in goal_text, "GOAL.md must name Mission 3BK")
    require(project_relative(ACTIVE_PROMPT) in goal_text, "GOAL.md must point at the M3BK prompt")
    require(project_relative(REVIEW_PATH) in goal_text, "GOAL.md must name the expected M3BK review artifact")
    require(project_relative(REVIEW_PATH) in prompt_text, "active prompt must name the M3BK review artifact")
    require("SemLex / ASL-LEX phonology is a candidate original-plan route" in training_plan_text, "training plan must retain SemLex / ASL-LEX caveat")
    require("source-register evidence" in training_plan_text, "training plan must require source-register evidence")
    require("vocabulary overlap" in training_plan_text, "training plan must require vocabulary overlap evidence")
    require(
        m3bj_receipt["exactly_one_next_action"] == "continue_semlex_overlap_and_source_review_no_training",
        "M3BJ receipt must select the M3BK handoff",
    )
    return {
        "goal_names_mission_3bk": True,
        "goal_points_at_active_prompt": True,
        "goal_names_expected_artifact": True,
        "active_prompt_names_expected_artifact": True,
        "training_plan_candidate_only_semlex_asl_lex": True,
        "m3bj_handoff_verified": True,
    }


def build_review(review_path: Path) -> dict[str, Any]:
    resolved_review_path = project_path(review_path, "review path", must_exist=False)
    source_register = load_json(SOURCE_REGISTER_PATH)
    supported_label_registry = load_json(SUPPORTED_LABEL_REGISTRY_PATH)
    active_vocabulary_claim = load_json(ACTIVE_VOCABULARY_CLAIM_PATH)
    vocabulary_items = parse_vocabulary_items()
    artifacts = local_semlex_asl_lex_artifacts(resolved_review_path)
    external_terms = extract_local_external_terms(artifacts)
    source_status = source_register_status(source_register)

    require(supported_label_registry["cv_supported_labels"] == [], "supported CV labels must remain empty")
    require(active_vocabulary_claim["activeLabels"] == [], "active recognition labels must remain empty")
    require(source_status["semlex"]["present_in_source_register"] is False, "SemLex source entry unexpectedly exists")
    require(source_status["asl_lex"]["video_use_currently_allowed_for_model_training"] is False, "ASL-LEX video use must remain blocked")
    require(not artifacts, "this slice expects no prior local SemLex/ASL-LEX/phonology artifact")

    review = {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BK - SemLex overlap and source review no-training",
        "status": "completed_candidate_source_gap_reviewed",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "generated_by": {
            "tool": project_relative(Path(__file__).resolve()),
            "script": file_reference(Path(__file__).resolve()),
            "command": [sys.executable, project_relative(Path(__file__).resolve()), "--review", project_relative(resolved_review_path), "--write-review"],
        },
        "source_of_truth_validation": validate_source_text(),
        "input_artifacts": [file_reference(path) for path in INPUT_PATHS],
        "claim_surfaces": [file_reference(path) for path in CLAIM_SURFACES],
        "current_fail_closed_claim_values": current_fail_closed_claim_values(),
        "source_register_status": source_status,
        "vocabulary_overlap_method": {
            "description": (
                "Parse ASL Pilot content vocabulary from web/src/lib/vocabulary.ts "
                "VOCABULARY_SEEDS, active recognition labels from active-vocabulary-claim, "
                "and CV-supported labels from supported-label-registry. Scan repo-local "
                "docs/research filenames matching semlex, asl-lex, or phonolog, excluding "
                "this generated review artifact. Extract exact JSON string values from keys "
                "label, label_id, id, gloss, sign, or word only. Normalize all terms by "
                "lowercasing, replacing underscores/hyphens/slashes with spaces, removing "
                "non-alphanumeric punctuation, and collapsing whitespace. Match only exact "
                "normalized ASL Pilot id/label aliases against exact normalized local "
                "external terms."
            ),
            "no_browsing": True,
            "no_source_import": True,
            "no_media_download": True,
            "source_vocabulary_surfaces": [
                {
                    "surface": "content_vocabulary",
                    "path": project_relative(VOCABULARY_TS_PATH),
                    "count": len(vocabulary_items),
                    "field": "VOCABULARY_SEEDS id and label",
                },
                {
                    "surface": "active_recognition_vocabulary",
                    "path": project_relative(ACTIVE_VOCABULARY_CLAIM_PATH),
                    "count": len(active_vocabulary_claim["activeLabels"]),
                    "field": "activeLabels",
                },
                {
                    "surface": "cv_supported_registry",
                    "path": project_relative(SUPPORTED_LABEL_REGISTRY_PATH),
                    "count": len(supported_label_registry["cv_supported_labels"]),
                    "field": "cv_supported_labels",
                },
            ],
            "local_external_artifact_globs": [
                "docs/research/*semlex*",
                "docs/research/*asl-lex*",
                "docs/research/*phonolog*",
            ],
            "local_external_artifacts": artifacts,
            "local_external_terms": external_terms,
        },
        "vocabulary_overlap_results": overlap_results(vocabulary_items, external_terms),
        "candidate_only_source_notes": [
            "ASL-LEX remains candidate-only for any metadata or phonology discussion and blocked for video/model-training use under the current source register.",
            "The current source register has no SemLex source entry, so SemLex is not approved for training, validation, or pilot submission.",
            "No repo-local SemLex/ASL-LEX/phonology vocabulary artifact exists to prove coverage against the current 100-item ASL Pilot content vocabulary.",
            "A later bounded source-register candidate can propose non-media metadata/phonology review boundaries, but it must not import media, approve videos, or create training eligibility by implication.",
        ],
        "training_use_blockers": [
            "ASL-LEX sign reference videos are excluded from the current license allowance and require explicit permission for video use.",
            "SemLex is absent from docs/model/dataset-source-register.json.",
            "No repo-local SemLex/ASL-LEX/phonology vocabulary artifact exists, so overlap coverage is not established.",
            "The active recognition vocabulary is empty and the browser model remains not_trained.",
            "This review does not add source-register approval, media, labels, tensors, manifests, or model evidence.",
        ],
        "non_promotion_statement": (
            "This artifact is source/vocabulary review only. It is not source approval, "
            "media import, SemLex/ASL-LEX training use, training readiness, browser "
            "readiness, model promotion, final validation, or an ASL correctness claim."
        ),
        "guardrails": {
            "source_imported": False,
            "source_approval_changed": False,
            "media_downloaded": False,
            "generated_pseudo_labels": False,
            "semlex_training_use": False,
            "asl_lex_video_training_use": False,
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
        "next_action_rationale": (
            "The review produced a precise no-import gap: ASL-LEX videos remain "
            "blocked, SemLex has no source-register entry, and local overlap coverage "
            "cannot be established without a repo-local metadata/phonology artifact. "
            "The next bounded local step is a candidate source-register proposal that "
            "separates metadata/phonology review from any media or training approval."
        ),
        "exactly_one_next_action": EXACTLY_ONE_NEXT_ACTION,
    }

    require(review["exactly_one_next_action"] == EXACTLY_ONE_NEXT_ACTION, "wrong next action")
    require(review["guardrails"]["source_imported"] is False, "source import must remain false")
    require(review["guardrails"]["source_approval_changed"] is False, "source approval change must remain false")
    require(review["guardrails"]["training_or_fitting_run"] is False, "training must remain false")
    require(review["current_fail_closed_claim_values"]["active_labels"] == [], "active labels must remain empty")
    return review


def main() -> int:
    args = parse_args()
    try:
        review_path = project_path(args.review, "review path", must_exist=False)
        review = build_review(review_path)
        if args.write_review:
            write_json(review_path, review)
        print(
            json.dumps(
                {
                    "status": "passed",
                    "review": project_relative(review_path),
                    "content_vocabulary_count": review["vocabulary_overlap_results"]["content_vocabulary_count"],
                    "local_external_artifact_count": len(review["vocabulary_overlap_method"]["local_external_artifacts"]),
                    "matched_content_vocabulary_count": review["vocabulary_overlap_results"]["matched_content_vocabulary_count"],
                    "exactly_one_next_action": review["exactly_one_next_action"],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except ReviewError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
