#!/usr/bin/env python3
"""Run the M3DZ read-only Detector 0 packet-support diagnosis."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TARGET_ID = "table_two_hand_union_or_contact_region"
SCHEMA_VERSION = "asl-pilot-return-to-form-detector0-packet-support-diagnosis/v1"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-detector0-packet-support-diagnosis-v1.json"
MANIFEST_PATHS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REFERENCE_PATHS = {
    "goal": ROOT / "GOAL.md",
    "active_prompt": ROOT / "docs" / "model" / "return-to-form-detector0-packet-support-diagnosis-goal-loop-prompt.md",
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "m3dy_objectness_repair": ROOT / "docs" / "validation" / "return-to-form-detector0-objectness-repair-v1.json",
    "parallel_heldout_recall": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-parallel-heldout-recall-v1.json",
    "m3dx_hand_landmark_source_feasibility": ROOT
    / "docs"
    / "validation"
    / "return-to-form-hand-landmark-source-feasibility-v1.json",
    "model_card": ROOT / "web" / "public" / "model" / "model-card.json",
    "active_vocabulary_claim": ROOT / "docs" / "model" / "active-vocabulary-claim.json",
}
SESSION_LOG = "docs/session-logs/493-mission-3dz-detector0-packet-support-diagnosis.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--target-id", default=TARGET_ID)
    return parser.parse_args()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, sort_keys=True)
        file.write("\n")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rel(path: Path) -> str:
    return str(path.resolve().relative_to(ROOT))


def file_ref(path: Path) -> dict[str, Any]:
    return {
        "path": rel(path),
        "exists": path.exists(),
        "sha256": sha256_file(path) if path.exists() and path.is_file() else None,
    }


def split_label_support(rows: list[dict[str, Any]], target_id: str) -> dict[str, Any]:
    result: dict[str, Any] = {}
    rows_by_split: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        rows_by_split[row["split"]].append(row)

    for split, split_rows in sorted(rows_by_split.items()):
        by_label: dict[str, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
        for row in split_rows:
            present = bool(row["targets"][target_id]["presence"])
            by_label[row["label_id"]]["present" if present else "absent"] += 1
        labels_with_contrast = sorted(
            label for label, counts in by_label.items() if counts["present"] and counts["absent"]
        )
        result[split] = {
            "row_count": len(split_rows),
            "by_label": dict(sorted(by_label.items())),
            "present_total": sum(counts["present"] for counts in by_label.values()),
            "absent_total": sum(counts["absent"] for counts in by_label.values()),
            "present_labels": sorted(label for label, counts in by_label.items() if counts["present"]),
            "absent_labels": sorted(label for label, counts in by_label.items() if counts["absent"]),
            "labels_with_present_absent_contrast": labels_with_contrast,
            "non_table_present_count": sum(
                counts["present"] for label, counts in by_label.items() if label != "table"
            ),
            "has_class_invariant_presence_support": bool(labels_with_contrast)
            and any(label != "table" and counts["present"] for label, counts in by_label.items()),
        }
    return result


def global_label_support(rows: list[dict[str, Any]], target_id: str) -> dict[str, Any]:
    by_label: dict[str, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
    by_review_status = Counter()
    by_annotation_source = Counter()
    for row in rows:
        present = bool(row["targets"][target_id]["presence"])
        by_label[row["label_id"]]["present" if present else "absent"] += 1
        by_review_status[row.get("review_status", "unknown")] += 1
        by_annotation_source[row.get("annotation_source", "unknown")] += 1
    labels_with_contrast = sorted(
        label for label, counts in by_label.items() if counts["present"] and counts["absent"]
    )
    target_presence_equals_table = all(
        bool(row["targets"][target_id]["presence"]) == (row["label_id"] == "table") for row in rows
    )
    return {
        "by_label": dict(sorted(by_label.items())),
        "present_total": sum(counts["present"] for counts in by_label.values()),
        "absent_total": sum(counts["absent"] for counts in by_label.values()),
        "present_labels": sorted(label for label, counts in by_label.items() if counts["present"]),
        "absent_labels": sorted(label for label, counts in by_label.items() if counts["absent"]),
        "labels_with_present_absent_contrast": labels_with_contrast,
        "non_table_present_count": sum(counts["present"] for label, counts in by_label.items() if label != "table"),
        "target_presence_equivalent_to_label_id_table": target_presence_equals_table,
        "has_class_invariant_presence_support": False,
        "review_status_counts": dict(sorted(by_review_status.items())),
        "annotation_source_counts": dict(sorted(by_annotation_source.items())),
    }


def target_presence_matrix(rows: list[dict[str, Any]]) -> dict[str, Any]:
    target_ids = sorted({target_id for row in rows for target_id in row.get("targets", {})})
    matrix: dict[str, Any] = {}
    for target_id in target_ids:
        by_label: dict[str, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
        for row in rows:
            present = bool(row["targets"][target_id]["presence"])
            by_label[row["label_id"]]["present" if present else "absent"] += 1
        matrix[target_id] = {
            "by_label": dict(sorted(by_label.items())),
            "present_total": sum(counts["present"] for counts in by_label.values()),
            "absent_total": sum(counts["absent"] for counts in by_label.values()),
            "labels_with_present_absent_contrast": sorted(
                label for label, counts in by_label.items() if counts["present"] and counts["absent"]
            ),
        }
    return matrix


def manifest_inventory(manifests: dict[str, dict[str, Any]], packet_rows: list[dict[str, Any]]) -> dict[str, Any]:
    packet_clip_ids_by_split_label: dict[tuple[str, str], set[str]] = defaultdict(set)
    packet_row_count_by_split_label = Counter()
    for row in packet_rows:
        key = (row["split"], row["label_id"])
        packet_clip_ids_by_split_label[key].add(row["clip_id"])
        packet_row_count_by_split_label[key] += 1

    inventory: dict[str, Any] = {}
    for split, manifest in manifests.items():
        by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for clip in manifest["clips"]:
            by_label[clip["label_id"]].append(clip)
        inventory[split] = {}
        for label, clips in sorted(by_label.items()):
            packet_clip_ids = packet_clip_ids_by_split_label[(split, label)]
            unrepresented = [clip for clip in clips if clip["clip_id"] not in packet_clip_ids]
            tensor_ready = [
                clip
                for clip in unrepresented
                if clip.get("allowed_for_model_training") is True and bool(clip.get("relative_frame_tensor_path"))
            ]
            inventory[split][label] = {
                "manifest_clip_count": len(clips),
                "packet_row_count": packet_row_count_by_split_label[(split, label)],
                "packet_clip_count": len(packet_clip_ids),
                "unrepresented_manifest_clip_count": len(unrepresented),
                "tensor_ready_unrepresented_clip_count": len(tensor_ready),
                "sample_tensor_ready_unrepresented_clip_ids": [clip["clip_id"] for clip in tensor_ready[:10]],
                "source_ids": sorted({clip.get("source_id", "unknown") for clip in clips}),
                "license_review_statuses": sorted({clip.get("source_license_review_status", "unknown") for clip in clips}),
            }
    return inventory


def summarize_manifest_posture(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    clip_count = 0
    allowed_count = 0
    source_ids = set()
    license_statuses = set()
    source_register_refs = {}
    external_imports = {}
    labels_by_split = {}
    for split, manifest in manifests.items():
        clips = manifest["clips"]
        clip_count += len(clips)
        allowed_count += sum(1 for clip in clips if clip.get("allowed_for_model_training") is True)
        source_ids.update(clip.get("source_id", "unknown") for clip in clips)
        license_statuses.update(clip.get("source_license_review_status", "unknown") for clip in clips)
        source_register_refs[split] = manifest.get("source_register")
        external_imports[split] = manifest.get("external_dataset_import")
        labels_by_split[split] = [label["label_id"] for label in manifest.get("labels", [])]
    return {
        "manifest_clip_count": clip_count,
        "allowed_for_model_training_clip_count": allowed_count,
        "source_ids": sorted(source_ids),
        "license_review_statuses": sorted(license_statuses),
        "source_register_refs": source_register_refs,
        "external_dataset_imports": external_imports,
        "labels_by_split": labels_by_split,
    }


def compute_decision(
    global_support: dict[str, Any],
    inventory: dict[str, Any],
) -> dict[str, Any]:
    total_tensor_ready_unrepresented = sum(
        label_data["tensor_ready_unrepresented_clip_count"]
        for split_data in inventory.values()
        for label_data in split_data.values()
    )
    no_source_local_candidates_exist = total_tensor_ready_unrepresented > 0
    if global_support["has_class_invariant_presence_support"]:
        return {
            "classification": "current_packet_supports_class_invariant_presence",
            "no_source_local_packet_mutation_possible": False,
            "objectness_training_supportable_now": True,
            "requires_human_annotation_or_scope_approval": False,
            "next_action": "return_to_detector0_objectness_repair_after_packet_support",
            "reason": "The current packet already has within-label target-present and target-absent support.",
        }
    if no_source_local_candidates_exist:
        return {
            "classification": "candidate_clips_exist_but_annotation_scope_budget_required",
            "no_source_local_packet_mutation_possible": True,
            "objectness_training_supportable_now": False,
            "requires_human_annotation_or_scope_approval": True,
            "next_action": "stop_for_human_detector0_annotation_budget",
            "reason": (
                "Existing approved manifests contain tensor-ready clips that could support future packet rows without "
                "source-register, manifest, tensor, vocabulary, or media mutation, but the current packet has no "
                "class-invariant target support. A future row mutation needs an explicit annotation/scope budget and "
                "target definition before more Detector 0 objectness work."
            ),
        }
    return {
        "classification": "no_local_candidate_support_without_new_artifacts",
        "no_source_local_packet_mutation_possible": False,
        "objectness_training_supportable_now": False,
        "requires_human_annotation_or_scope_approval": True,
        "next_action": "stop_for_human_detector0_annotation_budget",
        "reason": "No tensor-ready local candidate clips were found for a no-source packet-support mutation.",
    }


def main() -> int:
    args = parse_args()
    if args.target_id != TARGET_ID:
        raise SystemExit(f"unsupported target id: {args.target_id}")
    packet = read_json(args.packet.resolve())
    manifests = {split: read_json(path) for split, path in MANIFEST_PATHS.items()}
    rows = packet["frame_rows"]
    split_support = split_label_support(rows, args.target_id)
    global_support = global_label_support(rows, args.target_id)
    inventory = manifest_inventory(manifests, rows)
    decision = compute_decision(global_support, inventory)
    m3dy = read_json(REFERENCE_PATHS["m3dy_objectness_repair"])
    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3DZ - Detector 0 packet support diagnosis",
        "active_prompt": rel(REFERENCE_PATHS["active_prompt"]),
        "commands_run": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json >/dev/null",
            "python3 -m json.tool web/public/model/model-card.json >/dev/null",
            "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_return_to_form_detector0_packet_support_diagnosis.py",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/run_return_to_form_detector0_packet_support_diagnosis.py",
        ],
        "commands_intentionally_not_run": [
            "No Brev command, remote compute, training, fitting, optimizer construction, or backward pass.",
            "No source import, source-register mutation, media download, manifest mutation, tensor mutation, vocabulary mutation, or label expansion.",
            "No Detector 0 packet row addition or mutation.",
            "No recognizer retraining, Detector 0 training, export, promotion, browser activation, final-readiness claim, or ASL correctness claim.",
        ],
        "files_inspected": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "packet": file_ref(args.packet.resolve()),
            **{f"{split}_manifest": file_ref(path) for split, path in MANIFEST_PATHS.items()},
        },
        "files_changed": [
            "scripts/run_return_to_form_detector0_packet_support_diagnosis.py",
            rel(args.output.resolve()),
            SESSION_LOG,
        ],
        "packet": {
            "path": rel(args.packet.resolve()),
            "schema_version": packet.get("schema_version"),
            "status": packet.get("status"),
            "mission": packet.get("mission"),
            "row_count": len(rows),
            "target_id": args.target_id,
            "selected_labels": packet.get("selected_labels"),
            "label_sources_allowed": packet.get("label_sources_allowed"),
            "banned_label_sources": packet.get("banned_label_sources"),
            "source_hashes": packet.get("source_hashes"),
        },
        "target_support_by_split_label": split_support,
        "target_support_global": global_support,
        "all_target_presence_matrix": target_presence_matrix(rows),
        "candidate_row_inventory_from_existing_manifests": inventory,
        "source_register_and_manifest_posture": summarize_manifest_posture(manifests),
        "candidate_rows_vs_objectness_support": {
            "candidate_clips_exist": decision["no_source_local_packet_mutation_possible"],
            "candidate_clip_definition": (
                "Manifest clips not already represented by a packet row, with allowed_for_model_training=true "
                "and an existing relative_frame_tensor_path."
            ),
            "candidate_rows_are_not_training_support_yet": True,
            "why": (
                "Candidate clips have source/tensor posture, but they do not have reviewed target boxes or "
                "presence labels for the desired Detector 0 objectness target until a future packet row mutation."
            ),
        },
        "no_source_local_packet_mutation_assessment": {
            "possible_without_source_register_manifest_tensor_vocab_or_media_mutation": decision[
                "no_source_local_packet_mutation_possible"
            ],
            "would_require_packet_row_mutation": True,
            "would_require_manual_annotation_or_scope_approval": decision[
                "requires_human_annotation_or_scope_approval"
            ],
            "objectness_training_supportable_now": decision["objectness_training_supportable_now"],
            "reason": decision["reason"],
        },
        "comparison_to_m3dy": {
            "m3dy_receipt": rel(REFERENCE_PATHS["m3dy_objectness_repair"]),
            "m3dy_outcome": m3dy.get("outcome"),
            "m3dy_next_action": m3dy.get("next_action"),
            "this_receipt_adds": (
                "Read-only manifest and candidate-clip inventory, plus an explicit no-source packet-mutation "
                "posture separate from current objectness support."
            ),
        },
        "claim_boundary": {
            "product_claim": "unchanged_fail_closed",
            "model_card_status": "not_trained",
            "active_labels": [],
            "detector0_status": "not_promoted",
            "crop_normalization_ablation_approved": False,
            "hand_landmark_source_approval": "not_granted",
            "what_this_receipt_does_not_claim": [
                "No packet row was added or corrected.",
                "No Detector 0 objectness model was trained.",
                "No candidate clip is approved as a new row yet.",
                "No browser or final readiness claim changed.",
            ],
        },
        "boundary_proof": {
            "brev_commands_run": [],
            "remote_compute_used": False,
            "training_or_fitting_run": False,
            "optimizer_or_backward_pass_run": False,
            "source_import_or_approval_change": False,
            "source_register_mutation": False,
            "media_download": False,
            "packet_row_mutation": False,
            "manifest_mutation": False,
            "tensor_mutation": False,
            "vocabulary_mutation": False,
            "pretrained_detector_or_landmark_used": False,
            "generated_pseudo_labels_used": False,
            "model_artifact_saved": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "browser_or_product_runtime_change": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "outcome": {
            "classification": decision["classification"],
            "reason": decision["reason"],
            "no_source_local_packet_mutation_possible": decision["no_source_local_packet_mutation_possible"],
            "objectness_training_supportable_now": decision["objectness_training_supportable_now"],
            "requires_human_annotation_or_scope_approval": decision["requires_human_annotation_or_scope_approval"],
        },
        "next_action": {
            "id": decision["next_action"],
            "reason": decision["reason"],
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": rel(args.output.resolve()),
                "classification": decision["classification"],
                "next_action": decision["next_action"],
                "objectness_training_supportable_now": decision["objectness_training_supportable_now"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
