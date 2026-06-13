#!/usr/bin/env python3
"""Audit that the PDF-derived source artifacts are current and complete."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = PROJECT_ROOT / "superbuilders-partner-project-asl-learning-with-computer-vision.pdf"
EXTRACTED_TEXT_PATH = PROJECT_ROOT / "docs" / "source-materials" / "pdf-extracted-text.md"
REQUIREMENTS_MATRIX_PATH = PROJECT_ROOT / "docs" / "source-materials" / "requirements-matrix.md"
EXPECTED_IDS = [f"R{index}" for index in range(1, 41)] + [f"D{index}" for index in range(1, 8)]
EXPECTED_REQUIREMENTS = {
    "R1": (
        "Build a browser-based American Sign Language learning app.",
        "Page 1, Product Overview",
    ),
    "R2": (
        "Target college ASL 1 or equivalent beginner learners.",
        "Page 1, Target Users",
    ),
    "R3": (
        "Assume new learners need repeated practice, clear feedback, and progress tracking.",
        "Page 1, Target Users",
    ),
    "R4": (
        "Do not assume learners understand sign linguistics, model confidence, or CV limitations.",
        "Page 1, Target Users",
    ),
    "R5": (
        "Build a controlled production pilot, not a full public product or research-grade assessment system.",
        "Page 1, Product Overview",
    ),
    "R40": (
        "Pilot must be usable enough for structured learner testing while keeping model scope, pedagogy, and privacy expectations realistic.",
        "Page 1, Product Overview",
    ),
    "R6": (
        "Core flow includes login, practice, prompt, camera permission, signing attempt, CV evaluation, pass/fail, hint, retry, and saved progress.",
        "Page 1, Core Learning Flow",
    ),
    "R7": ("Support American Sign Language only.", "Page 2, Requirement 1"),
    "R8": (
        "Do not support BSL, other signed languages, or automatic translation between signed languages.",
        "Page 2, Requirement 1",
    ),
    "R9": ("Support isolated beginner ASL vocabulary signs.", "Page 2, Requirement 2"),
    "R10": (
        "Include 75-100 beginner vocabulary items appropriate for ASL 1 learners.",
        "Page 2, Requirement 2; Page 5, Success Criteria and Final Deliverables",
    ),
    "R11": (
        "Do not attempt full sentence recognition, conversational interpretation, open-ended signing, or phrase-level translation.",
        "Page 2, Requirement 2; Page 4, Out of Scope",
    ),
    "R12": (
        "Run as a modern web browser app on a computer with camera access.",
        "Page 2, Requirement 3",
    ),
    "R13": (
        "Request learner camera access and use live camera feed for signing attempts.",
        "Page 2, Requirement 4",
    ),
    "R14": (
        "Handle denied, unavailable, or unsupported camera access.",
        "Page 2, Requirement 4",
    ),
    "R15": ("Default sign recognition runs in the browser.", "Page 2, Requirement 5"),
    "R16": (
        "Camera frames stay local during normal practice sessions.",
        "Page 2, Requirement 5; Page 4, Requirement 13",
    ),
    "R17": (
        "Future server-side inference interface may exist, but server-side inference is not required and not the default path.",
        "Page 2, Requirement 5; Page 4, Out of Scope",
    ),
    "R18": (
        "Engineering team curates or collects the dataset used to train the model.",
        "Page 2, Requirement 6",
    ),
    "R19": (
        "Include model training process, validation process, and model versioning strategy.",
        "Page 2, Requirement 6",
    ),
    "R20": ("Do not treat the model as only a black-box dependency.", "Page 2, Requirement 6"),
    "R21": ("Do not use pretrained models for CV or sign recognition.", "Page 3, Requirement 7"),
    "R22": (
        "Do not use pretrained sign classifiers, hand/pose landmark detectors, feature extractors, or general-purpose CV backbones.",
        "Page 3, Requirement 7",
    ),
    "R23": (
        "Programming frameworks, data processing libraries, and ML libraries are allowed; architecture and weights must be trained by the team.",
        "Page 3, Requirement 7",
    ),
    "R24": (
        "Define and document controlled pilot quality: camera/lighting, distance/framing, held-out validation, accuracy targets, thresholds, limitations.",
        "Page 3, Requirement 8",
    ),
    "R25": (
        "Pilot need not be classroom-assessment-grade, research-grade, or reliable across all real-world environments.",
        "Page 3, Requirement 8",
    ),
    "R26": ("For each prompted sign, return pass/fail based on learner attempt.", "Page 3, Requirement 9"),
    "R27": (
        "Use documented confidence thresholds and avoid marking uncertain predictions correct.",
        "Page 3, Requirement 9",
    ),
    "R28": ("Failed attempts receive targeted hints, not only \"incorrect.\"", "Page 3, Requirement 10"),
    "R29": (
        "Hints relate to observable or teachable aspects: handshape, movement, location, orientation, timing, or framing.",
        "Page 3, Requirement 10",
    ),
    "R30": ("Include learner accounts with login and saved practice history across sessions.", "Page 3, Requirement 11"),
    "R31": (
        "Teacher/admin accounts, rostering, and SSO are out of scope.",
        "Page 3, Requirement 11; Page 4, Out of Scope",
    ),
    "R32": ("Save learner progress over time.", "Page 4, Requirement 12"),
    "R33": (
        "Track vocabulary attempted, pass/fail outcomes, attempt counts, mastery/completion status, and recent history.",
        "Page 4, Requirement 12",
    ),
    "R34": ("Do not upload raw video by default.", "Page 4, Requirement 13"),
    "R35": (
        "Future data collection requires explicit consent and separate documentation.",
        "Page 4, Requirement 13",
    ),
    "R36": ("UX must be simple enough for beginners without technical assistance.", "Page 4, Requirement 14"),
    "R37": (
        "Practice screen shows prompt, camera preview, attempt state, result, hint, retry, and next action.",
        "Page 4, Requirement 14",
    ),
    "R38": (
        "Final docs cover product scope, model approach, dataset approach, validation criteria, privacy assumptions, limitations, and no-pretrained evidence.",
        "Page 4, Requirement 15",
    ),
    "R39": (
        "Production-scale public deployment is out of scope for the pilot.",
        "Page 5, Out of Scope for Pilot",
    ),
    "D1": ("Submit working browser-based ASL learning application.", "Page 5, Final Deliverables"),
    "D2": (
        "Submit trained sign recognition model for 75-100 beginner ASL vocabulary signs.",
        "Page 5, Final Deliverables",
    ),
    "D3": (
        "Submit documented dataset and model training process showing no pretrained models were used.",
        "Page 5, Final Deliverables",
    ),
    "D4": (
        "Submit validation report with accuracy targets, test conditions, and known limitations.",
        "Page 5, Final Deliverables",
    ),
    "D5": ("Submit learner account and progress-tracking system.", "Page 5, Final Deliverables"),
    "D6": (
        "Submit practice interface with camera access, pass/fail feedback, targeted hints, retry behavior, and saved progress.",
        "Page 5, Final Deliverables",
    ),
    "D7": ("Submit privacy documentation explaining camera/video handling.", "Page 5, Final Deliverables"),
}
EXPECTED_HEADINGS = [
    "Product Overview",
    "Target Users",
    "Core Learning Flow",
    "Required Pilot Scope",
    "No Pretrained Models",
    "Success Criteria",
    "Final Deliverables",
]


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(value: str) -> str:
    cleaned_lines = []
    for line in value.splitlines():
        cleaned = re.sub(r"^\s{0,3}#{1,6}\s*", "", line)
        cleaned = re.sub(r"^\s{0,3}[-*]\s+", "", cleaned)
        cleaned_lines.append(cleaned)
    collapsed = re.sub(r"\s+", " ", "\n".join(cleaned_lines)).strip()
    collapsed = re.sub(
        r"\d{1,2}/\d{1,2}/\d{2}, \d{1,2}:\d{2} [AP]M "
        r"Superbuilders Partner Project - ASL Learning with Computer Vision "
        r"file:///\S+ \d+/\d+",
        "",
        collapsed,
    )
    collapsed = re.sub(r"-\s+", "-", collapsed)
    return re.sub(r"\s+", " ", collapsed).strip()


def load_pdf_pages(blockers: list[str]) -> list[str]:
    try:
        import fitz  # type: ignore[import-not-found]
    except Exception as error:  # pragma: no cover - exercised only when env is broken
        blockers.append(f"PyMuPDF import failed: {error}")
        return []

    if not PDF_PATH.exists():
        blockers.append(f"PDF is missing: {PDF_PATH.relative_to(PROJECT_ROOT)}")
        return []

    try:
        document = fitz.open(PDF_PATH)
    except Exception as error:
        blockers.append(f"PDF could not be opened with PyMuPDF: {error}")
        return []

    pages = [page.get_text("text").strip() for page in document]
    if len(pages) != 5:
        blockers.append(f"PDF must have 5 pages; found {len(pages)}")
    for index, page_text in enumerate(pages, start=1):
        if not page_text:
            blockers.append(f"PDF page {index} extracted as empty text")
    return pages


def audit_extracted_text(pages: list[str], blockers: list[str]) -> dict[str, Any]:
    if not EXTRACTED_TEXT_PATH.exists():
        blockers.append(f"Extracted text artifact is missing: {EXTRACTED_TEXT_PATH.relative_to(PROJECT_ROOT)}")
        return {"path": str(EXTRACTED_TEXT_PATH.relative_to(PROJECT_ROOT)), "exists": False}

    artifact = EXTRACTED_TEXT_PATH.read_text(encoding="utf-8")
    normalized_artifact = normalize(artifact)
    if f"Source PDF: `{PDF_PATH.name}`" not in artifact:
        blockers.append("Extracted text artifact must name the source PDF")
    pdf_sha256 = sha256_file(PDF_PATH) if PDF_PATH.exists() else None
    if pdf_sha256 and f"Source PDF SHA-256: `{pdf_sha256}`" not in artifact:
        blockers.append("Extracted text artifact must bind the current source PDF SHA-256")
    if "PyMuPDF" not in artifact or 'page.get_text("text")' not in artifact:
        blockers.append("Extracted text artifact must document the PyMuPDF extraction method")

    missing_pages: list[int] = []
    mismatched_pages: list[int] = []
    for index, page_text in enumerate(pages, start=1):
        if f"## Page {index}" not in artifact:
            missing_pages.append(index)
        if page_text and normalize(page_text) not in normalized_artifact:
            mismatched_pages.append(index)
    if missing_pages:
        blockers.append(f"Extracted text artifact is missing page headings: {missing_pages}")
    if mismatched_pages:
        blockers.append(f"Extracted text artifact does not match current PDF extraction for pages: {mismatched_pages}")

    for heading in EXPECTED_HEADINGS:
        if heading not in artifact:
            blockers.append(f"Extracted text artifact is missing expected heading: {heading}")

    return {
        "path": str(EXTRACTED_TEXT_PATH.relative_to(PROJECT_ROOT)),
        "exists": True,
        "sha256": sha256_file(EXTRACTED_TEXT_PATH),
    }


def audit_requirements_matrix(blockers: list[str]) -> dict[str, Any]:
    if not REQUIREMENTS_MATRIX_PATH.exists():
        blockers.append(f"Requirements matrix is missing: {REQUIREMENTS_MATRIX_PATH.relative_to(PROJECT_ROOT)}")
        return {"path": str(REQUIREMENTS_MATRIX_PATH.relative_to(PROJECT_ROOT)), "exists": False}

    matrix = REQUIREMENTS_MATRIX_PATH.read_text(encoding="utf-8")
    if "docs/source-materials/pdf-extracted-text.md" not in matrix:
        blockers.append("Requirements matrix must identify pdf-extracted-text.md as its source")
    pdf_sha256 = sha256_file(PDF_PATH) if PDF_PATH.exists() else None
    if pdf_sha256 and f"Source PDF SHA-256: `{pdf_sha256}`" not in matrix:
        blockers.append("Requirements matrix must bind the current source PDF SHA-256")

    ids = re.findall(r"\|\s*((?:R|D)\d+)\s*\|", matrix)
    unique_ids = sorted(set(ids), key=lambda item: (item[0], int(item[1:])))
    missing_ids = [item for item in EXPECTED_IDS if item not in ids]
    duplicate_ids = sorted({item for item in ids if ids.count(item) > 1}, key=lambda item: (item[0], int(item[1:])))
    unexpected_ids = [item for item in ids if item not in EXPECTED_IDS]
    if missing_ids:
        blockers.append(f"Requirements matrix is missing IDs: {missing_ids}")
    if duplicate_ids:
        blockers.append(f"Requirements matrix contains duplicate IDs: {duplicate_ids}")
    if unexpected_ids:
        blockers.append(f"Requirements matrix contains unexpected IDs: {unexpected_ids}")

    row_pattern = re.compile(r"^\|\s*((?:R|D)\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|$", re.MULTILINE)
    rows = row_pattern.findall(matrix)
    rows_by_id = {row_id: (requirement.strip(), evidence.strip()) for row_id, requirement, evidence in rows}
    for item in EXPECTED_IDS:
        requirement, evidence = rows_by_id.get(item, ("", ""))
        if not requirement:
            blockers.append(f"Requirements matrix row {item} must include requirement text")
        elif requirement != EXPECTED_REQUIREMENTS[item][0]:
            blockers.append(f"Requirements matrix row {item} requirement text drifted")
        if "Page " not in evidence:
            blockers.append(f"Requirements matrix row {item} must include page evidence")
        elif evidence != EXPECTED_REQUIREMENTS[item][1]:
            blockers.append(f"Requirements matrix row {item} page evidence drifted")

    return {
        "path": str(REQUIREMENTS_MATRIX_PATH.relative_to(PROJECT_ROOT)),
        "exists": True,
        "sha256": sha256_file(REQUIREMENTS_MATRIX_PATH),
        "requirement_ids": unique_ids,
    }


def main() -> int:
    blockers: list[str] = []
    pages = load_pdf_pages(blockers)
    extracted_text = audit_extracted_text(pages, blockers)
    requirements_matrix = audit_requirements_matrix(blockers)

    summary = {
        "status": "passed" if not blockers else "failed",
        "pdf": {
            "path": str(PDF_PATH.relative_to(PROJECT_ROOT)),
            "exists": PDF_PATH.exists(),
            "sha256": sha256_file(PDF_PATH) if PDF_PATH.exists() else None,
            "page_count": len(pages),
        },
        "extracted_text": extracted_text,
        "requirements_matrix": requirements_matrix,
        "blockers": blockers,
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    if blockers:
        print("PDF extraction audit failed:", file=sys.stderr)
        for blocker in blockers:
            print(f"- {blocker}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
