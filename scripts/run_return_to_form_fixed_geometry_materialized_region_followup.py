#!/usr/bin/env python3
"""Write the M3EE fixed-geometry materialized-region follow-up receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import shlex
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-fixed-geometry-materialized-region-followup/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-fixed-geometry-materialized-region-followup-v1.json"
ACTIVE_PROMPT = ROOT / "docs" / "model" / "return-to-form-fixed-geometry-materialized-region-followup-goal-loop-prompt.md"
SESSION_LOG = "docs/session-logs/505-mission-3ee-fixed-geometry-materialized-region-followup.md"
MANIFESTS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REFERENCE_PATHS = {
    "goal": ROOT / "GOAL.md",
    "active_prompt": ACTIVE_PROMPT,
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "m3ed_claim_reduction": ROOT / "docs" / "validation" / "return-to-form-fixed-geometric-claim-reduction-v1.json",
    "m3ec_crop_normalization_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-fixed-geometric-crop-normalization-smoke-v1.json",
    "m3eb_fixed_geometric_fallback": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-fixed-geometric-fallback-v1.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "model_card": ROOT / "web" / "public" / "model" / "model-card.json",
    "active_vocabulary_claim": ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    "runner": Path(__file__).resolve(),
    **{f"{split}_manifest": path for split, path in MANIFESTS.items()},
}
COMMANDS_RUN = [
    "git status --short --branch",
    "git log -10 --oneline --decorate",
    "node scripts/audit_loop_premise.mjs --json",
    "node scripts/audit_return_to_form_plan.mjs --json",
    "node scripts/audit_no_pretrained_deps.mjs",
    "node scripts/audit_no_pretrained_artifact_json.mjs",
    "node scripts/audit_source_register.mjs",
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null",
    "python3 -m json.tool web/public/model/model-card.json >/dev/null",
    "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    "brev ls --json",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_fixed_geometry_materialized_region_followup.py",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
    "scripts/run_return_to_form_fixed_geometry_materialized_region_followup.py",
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json >/dev/null",
    "git diff --check",
]
REQUIRED_REGION_IDS = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]
ACCOUNTING_REGION_IDS = ["upper_body_signing_space", "head_context", "full_frame_reference"]
MATERIALIZED_INPUT_NEXT_ACTION = "materialized_region_model_input_diagnostic_no_brev"
ALLOWED_NEXT_ACTIONS = {
    "continue_materialized_region_followup_no_brev",
    "materialized_region_model_input_diagnostic_no_brev",
    "return_to_detector0_after_annotation_budget",
    "escalate_crop_strategy_research",
    "stop_reduced_claim",
    "stop_for_human_fixed_geometry_scope_review",
}


class MaterializedRegionError(RuntimeError):
    """Raised when the M3EE receipt cannot be produced."""


class RegionAccumulator:
    def __init__(self) -> None:
        self.value_sum = 0.0
        self.value_sumsq = 0.0
        self.value_count = 0
        self.temporal_abs_sum = 0.0
        self.temporal_abs_count = 0
        self.full_frame_abs_delta_sum = 0.0
        self.full_frame_abs_delta_count = 0
        self.clip_count = 0
        self.frame_count = 0

    def add(self, tensor: Any, full_frame: Any | None = None) -> None:
        data = tensor.to(dtype=tensor.new_empty(()).double().dtype)
        self.clip_count += 1
        self.frame_count += int(data.shape[0])
        self.value_sum += float(data.sum().item())
        self.value_sumsq += float((data * data).sum().item())
        self.value_count += int(data.numel())
        if int(data.shape[0]) > 1:
            delta = (data[1:] - data[:-1]).abs()
            self.temporal_abs_sum += float(delta.sum().item())
            self.temporal_abs_count += int(delta.numel())
        if full_frame is not None:
            full = full_frame.to(dtype=data.dtype)
            full_delta = (data - full).abs()
            self.full_frame_abs_delta_sum += float(full_delta.sum().item())
            self.full_frame_abs_delta_count += int(full_delta.numel())

    def summary(self) -> dict[str, Any]:
        mean = self.value_sum / self.value_count if self.value_count else None
        variance = None
        if mean is not None:
            variance = max(0.0, self.value_sumsq / self.value_count - mean * mean)
        return {
            "clip_count": self.clip_count,
            "frame_count": self.frame_count,
            "pixel_value_count": self.value_count,
            "pixel_mean": round_float(mean),
            "pixel_std": round_float(math.sqrt(variance)) if variance is not None else None,
            "temporal_abs_delta_mean": round_float(self.temporal_abs_sum / self.temporal_abs_count)
            if self.temporal_abs_count
            else None,
            "mean_abs_delta_vs_full_frame_reference_same_shape": round_float(
                self.full_frame_abs_delta_sum / self.full_frame_abs_delta_count
            )
            if self.full_frame_abs_delta_count
            else None,
        }


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


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise MaterializedRegionError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise MaterializedRegionError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise MaterializedRegionError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(value, dict):
        raise MaterializedRegionError(f"JSON root must be an object: {project_relative(path)}")
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def round_float(value: float | None) -> float | None:
    if value is None:
        return None
    return round(float(value), 12)


def nested(data: dict[str, Any], path: list[str], context: str) -> Any:
    value: Any = data
    for key in path:
        if not isinstance(value, dict) or key not in value:
            raise MaterializedRegionError(f"{context} missing {'.'.join(path)}")
        value = value[key]
    return value


def expected_digest(value: Any, context: str) -> str:
    if not isinstance(value, str):
        raise MaterializedRegionError(f"{context} must be a string")
    normalized = value.strip().lower()
    if len(normalized) != 64 or any(character not in "0123456789abcdef" for character in normalized):
        raise MaterializedRegionError(f"{context} must be a lowercase SHA-256 digest")
    return normalized


def import_torch() -> Any:
    try:
        import torch  # type: ignore
    except Exception as error:  # noqa: BLE001 - include environment failure in receipt command output.
        raise MaterializedRegionError(f"could not import torch for read-only tensor accounting: {error}") from error
    return torch


def load_regions(torch: Any, tensor_path: Path, context: str) -> tuple[Any, list[str]]:
    try:
        loaded = torch.load(tensor_path, map_location="cpu", weights_only=True)
    except TypeError:
        loaded = torch.load(tensor_path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - keep tensor path visible.
        raise MaterializedRegionError(f"{context} could not load tensor payload {project_relative(tensor_path)}: {error}") from error
    if not isinstance(loaded, dict):
        raise MaterializedRegionError(f"{context} tensor payload must be a dict")
    regions = loaded.get("rgb_regions")
    region_ids = loaded.get("region_ids")
    if not torch.is_tensor(regions):
        raise MaterializedRegionError(f"{context} tensor payload missing rgb_regions")
    if not isinstance(region_ids, list) or not all(isinstance(item, str) for item in region_ids):
        raise MaterializedRegionError(f"{context} tensor payload missing region_ids")
    if regions.ndim != 5 or int(regions.shape[-1]) != 3:
        raise MaterializedRegionError(f"{context} rgb_regions must be T,R,H,W,C with 3 channels")
    return regions, [str(item) for item in region_ids]


def tensor_path_for_clip(clip: dict[str, Any], manifest_path: Path, context: str) -> Path:
    value = clip.get("relative_frame_tensor_path")
    if not isinstance(value, str):
        raise MaterializedRegionError(f"{context} missing relative_frame_tensor_path")
    return (manifest_path.parent / value).resolve()


def manifest_accounting(torch: Any) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    split_summary: dict[str, Any] = {}
    tensor_inputs = []
    region_stats: dict[str, dict[str, RegionAccumulator]] = defaultdict(
        lambda: {region_id: RegionAccumulator() for region_id in ACCOUNTING_REGION_IDS}
    )
    all_stats = {region_id: RegionAccumulator() for region_id in ACCOUNTING_REGION_IDS}

    for split, manifest_path in MANIFESTS.items():
        manifest = read_json(manifest_path)
        clips = manifest.get("clips")
        if not isinstance(clips, list):
            raise MaterializedRegionError(f"{project_relative(manifest_path)} clips must be an array")
        label_counts: Counter[str] = Counter()
        source_counts: Counter[str] = Counter()
        shape_counts: Counter[str] = Counter()
        region_order_counts: Counter[str] = Counter()
        tensor_hash_verified = 0

        for index, clip in enumerate(clips):
            if not isinstance(clip, dict):
                raise MaterializedRegionError(f"{project_relative(manifest_path)} clips[{index}] must be an object")
            clip_id = str(clip.get("clip_id"))
            label_id = str(clip.get("label_id"))
            context = f"{project_relative(manifest_path)}:{clip_id}"
            label_counts[label_id] += 1
            source_counts[str(clip.get("source_id"))] += 1
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            expected_hash = expected_digest(clip.get("frame_tensor_sha256"), f"{context} frame_tensor_sha256")
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise MaterializedRegionError(f"{context} tensor hash mismatch")
            tensor_hash_verified += 1

            regions, region_ids = load_regions(torch, tensor_path, context)
            if region_ids != REQUIRED_REGION_IDS:
                raise MaterializedRegionError(f"{context} region order mismatch: {region_ids}")
            shape = [int(value) for value in regions.shape]
            shape_counts["x".join(str(value) for value in shape)] += 1
            region_order_counts[",".join(region_ids)] += 1
            if shape[1] != len(region_ids):
                raise MaterializedRegionError(f"{context} region axis does not match region_ids")

            full_frame = regions[:, region_ids.index("full_frame_reference")]
            for region_id in ACCOUNTING_REGION_IDS:
                region_tensor = regions[:, region_ids.index(region_id)]
                full_for_delta = None if region_id == "full_frame_reference" else full_frame
                region_stats[split][region_id].add(region_tensor, full_for_delta)
                all_stats[region_id].add(region_tensor, full_for_delta)

            tensor_inputs.append(
                {
                    "split": split,
                    "clip_id": clip_id,
                    "label_id": label_id,
                    "path": project_relative(tensor_path),
                    "sha256": actual_hash,
                }
            )

        split_summary[split] = {
            "manifest": file_ref(manifest_path),
            "clip_count": len(clips),
            "label_counts": dict(sorted(label_counts.items())),
            "source_id_counts": dict(sorted(source_counts.items())),
            "tensor_hash_verified_count": tensor_hash_verified,
            "tensor_shape_counts": dict(sorted(shape_counts.items())),
            "region_order_counts": dict(sorted(region_order_counts.items())),
            "region_input_statistics": {
                region_id: region_stats[split][region_id].summary() for region_id in ACCOUNTING_REGION_IDS
            },
        }

    path_digest_payload = json.dumps(tensor_inputs, sort_keys=True, separators=(",", ":"))
    return (
        split_summary,
        tensor_inputs,
        {
            "region_input_statistics_all_splits": {
                region_id: all_stats[region_id].summary() for region_id in ACCOUNTING_REGION_IDS
            },
            "tensor_file_count": len(tensor_inputs),
            "tensor_inputs_path_hash_digest_sha256": sha256_text(path_digest_payload),
            "tensor_inputs_first_five": tensor_inputs[:5],
            "tensor_inputs_last_five": tensor_inputs[-5:],
        },
    )


def main() -> int:
    args = parse_args()
    torch = import_torch()
    m3ed = read_json(REFERENCE_PATHS["m3ed_claim_reduction"])
    m3ec = read_json(REFERENCE_PATHS["m3ec_crop_normalization_smoke"])
    model_card = read_json(REFERENCE_PATHS["model_card"])
    active_vocabulary = read_json(REFERENCE_PATHS["active_vocabulary_claim"])
    split_summary, tensor_inputs, aggregate_accounting = manifest_accounting(torch)

    m3ed_next = nested(m3ed, ["next_action", "id"], "M3ED receipt")
    if m3ed_next != "fixed_geometry_materialized_region_followup_no_brev":
        raise MaterializedRegionError(f"M3ED receipt next_action mismatch: {m3ed_next}")
    m3ec_summary = nested(m3ec, ["inclusion_and_hidden_evidence_accounting", "summary"], "M3EC receipt")
    next_action = MATERIALIZED_INPUT_NEXT_ACTION
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise MaterializedRegionError(f"internal next action is not allowed: {next_action}")

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3EE - Fixed-geometry materialized-region follow-up",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": COMMANDS_RUN,
        "commands_intentionally_not_run": [
            "No Brev worker creation, sync, SSH, remote compute, remote training, stop, delete, reset, or spend.",
            "No source import, media download, source-register mutation, manifest mutation, tracked tensor mutation, vocabulary mutation, label expansion, or packet-row mutation.",
            "No training, fitting, classifier/model-input diagnostic comparison, optimizer construction, backward pass, checkpoint, promoted model artifact, ONNX export, browser asset, model-card promotion, or product-runtime change.",
            "No exact-M3EB-ROI unqualified interaction-preservation claim, hand-landmark source import, pretrained/generated-label path, browser activation, ASL-correctness claim, final-readiness claim, raw learner video upload, or push.",
        ],
        "source_artifacts": {name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
        "files_changed": [
            "scripts/run_return_to_form_fixed_geometry_materialized_region_followup.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "input_scope": {
            "manifest_accounting": split_summary,
            "tensor_file_count": aggregate_accounting["tensor_file_count"],
            "tensor_inputs_path_hash_digest_sha256": aggregate_accounting["tensor_inputs_path_hash_digest_sha256"],
            "tensor_inputs_first_five": aggregate_accounting["tensor_inputs_first_five"],
            "tensor_inputs_last_five": aggregate_accounting["tensor_inputs_last_five"],
            "full_tensor_input_list_recorded_in_m3ec": project_relative(
                REFERENCE_PATHS["m3ec_crop_normalization_smoke"]
            ),
        },
        "materialized_region_behavior": {
            "regions_checked": ACCOUNTING_REGION_IDS,
            **aggregate_accounting,
            "materialized_upper_body_vs_reduced_exact_roi": {
                "exact_m3eb_primary_roi_left_hand_full_containment_rate": m3ec_summary[
                    "m3eb_primary_left_hand_full_containment_rate"
                ],
                "exact_m3eb_primary_roi_table_union_contact_full_containment_rate": m3ec_summary[
                    "m3eb_primary_table_union_full_containment_rate"
                ],
                "materialized_upper_body_table_union_contact_full_containment_rate": m3ec_summary[
                    "existing_upper_body_table_union_full_containment_rate"
                ],
                "materialized_upper_body_right_hand_full_containment_rate": m3ec_summary[
                    "existing_upper_body_right_hand_full_containment_rate"
                ],
                "materialized_region_preserves_more_current_interaction_box_evidence_than_exact_m3eb_roi": True,
            },
            "full_frame_reference_baseline": {
                "available_for_all_checked_tensors": True,
                "recommended_role": (
                    "honest baseline for any future model-input diagnostic because it avoids claiming a crop preserves "
                    "all hand/contact evidence"
                ),
            },
        },
        "claim_boundaries": {
            "exact_m3eb_roi": {
                "status": "reduced_claim_preserved",
                "may_claim": "deterministic diagnostic/accounting geometry only",
                "must_not_claim": "unqualified interaction-preserving model input or product authority",
            },
            "materialized_upper_body_head_regions": {
                "may_claim": (
                    "consistent existing approved tensor inputs with broader interaction coverage than exact M3EB ROI "
                    "for the current packet evidence"
                ),
                "must_not_claim": (
                    "runtime Detector 0 objectness, hand tracking, hand landmarks, browser recognition, product "
                    "readiness, ASL correctness, or final readiness"
                ),
            },
            "current_product_claim_surface": {
                "model_card_status": model_card.get("status"),
                "active_labels": active_vocabulary.get("activeLabels"),
                "browser_recognition": "fail_closed_inactive",
                "claim_surface_mutated": False,
            },
        },
        "optional_diagnostic_metric": {
            "model_input_comparison_run": False,
            "reason": (
                "Transform/input accounting established consistent materialized region availability, nonblank/distinct "
                "input statistics, and stronger current interaction-box containment than the exact M3EB ROI. The actual "
                "random-init model-input comparison should be a separate bounded slice."
            ),
        },
        "followup_decision": {
            "bounded_model_input_diagnostic_justified": True,
            "next_action": next_action,
            "allowed_future_test": (
                "one local random-init diagnostic comparison of materialized upper_body_signing_space/head_context "
                "inputs against full_frame_reference baseline, using current approved tensors/manifests only"
            ),
            "required_future_limits": [
                "no Brev or remote compute",
                "no pretrained or generated-label path",
                "no checkpoint, promoted model artifact, ONNX export, browser asset, model-card update, or product runtime change",
                "preserve M3ED reduced exact-ROI claim",
            ],
        },
        "boundaries": {
            "local_only": True,
            "read_only_existing_manifests_and_tensors": True,
            "training": False,
            "fitting": False,
            "classifier_or_model_input_diagnostic": False,
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
        "outcome": {
            "classification": "materialized_regions_consistent_model_input_diagnostic_justified",
            "next_action": next_action,
            "reason": (
                "All 345 approved manifest tensors expose materialized upper-body/head/full-frame regions with valid "
                "hashes and nonblank/distinct read-only input statistics. Materialized upper-body preserves more current "
                "interaction box evidence than the reduced exact M3EB ROI, but full-frame remains the honest baseline."
            ),
        },
        "next_action": {
            "id": next_action,
            "reason": (
                "Run one bounded local random-init model-input diagnostic comparing materialized upper-body/head inputs "
                "against full-frame references, with no artifact promotion and fail-closed product claims."
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
                "tensor_file_count": aggregate_accounting["tensor_file_count"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except MaterializedRegionError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
