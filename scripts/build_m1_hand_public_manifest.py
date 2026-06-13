#!/usr/bin/env python3
"""Build the M1 public hand-landmark manifest from local source archives.

The manifest is intentionally dataset-content only: it records source archive
members, projected/normalized labels, crop boxes, and provenance. It does not
download data, create image crops, or train a model.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import pickle
import sys
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence


SCHEMA_VERSION = "asl-pilot-m1-hand-public-manifest/v1"
FREIHAND_IMAGE_SIZE = (224, 224)
RHD_IMAGE_SIZE = (320, 320)
HAND_KEYPOINTS = 21
LICENSE_GATE = "local_training_only_distribution_pending"


def finite(value: float) -> bool:
    return math.isfinite(float(value))


def repo_relative(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(Path.cwd().resolve()))
    except ValueError:
        return str(path)


def project_xyz_to_uv(xyz: Sequence[Sequence[float]], k_matrix: Sequence[Sequence[float]]) -> list[list[float]]:
    """Project 3D camera-frame points through a 3x3 intrinsic matrix."""

    projected: list[list[float]] = []
    for point in xyz:
        x, y, z = float(point[0]), float(point[1]), float(point[2])
        if abs(z) < 1e-8:
            projected.append([float("nan"), float("nan")])
            continue
        u = (float(k_matrix[0][0]) * x + float(k_matrix[0][1]) * y + float(k_matrix[0][2]) * z) / z
        v = (float(k_matrix[1][0]) * x + float(k_matrix[1][1]) * y + float(k_matrix[1][2]) * z) / z
        projected.append([u, v])
    return projected


def visible_xy(
    points_xy: Sequence[Sequence[float]],
    visibility: Sequence[float],
    image_width: int,
    image_height: int,
) -> list[tuple[float, float]]:
    out: list[tuple[float, float]] = []
    for point, vis in zip(points_xy, visibility):
        x, y = float(point[0]), float(point[1])
        if float(vis) > 0 and finite(x) and finite(y):
            # Keep slightly out-of-frame labels in the record, but do not let
            # them drive crop geometry.
            if 0.0 <= x <= image_width and 0.0 <= y <= image_height:
                out.append((x, y))
    return out


def box_xyxy_from_points(
    points_xy: Sequence[Sequence[float]],
    visibility: Sequence[float],
    image_width: int,
    image_height: int,
) -> list[float] | None:
    pts = visible_xy(points_xy, visibility, image_width, image_height)
    if not pts:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return [min(xs), min(ys), max(xs), max(ys)]


def square_crop_from_box(
    box_xyxy: Sequence[float],
    image_width: int,
    image_height: int,
    context: float = 0.25,
) -> list[float]:
    x0, y0, x1, y1 = [float(v) for v in box_xyxy]
    width = max(1.0, x1 - x0)
    height = max(1.0, y1 - y0)
    cx = (x0 + x1) * 0.5
    cy = (y0 + y1) * 0.5
    side = max(width, height) * (1.0 + 2.0 * context)
    side = max(2.0, min(side, float(max(image_width, image_height))))

    crop_x0 = cx - side * 0.5
    crop_y0 = cy - side * 0.5
    if side <= image_width:
        crop_x0 = min(max(0.0, crop_x0), image_width - side)
    else:
        crop_x0 = 0.0
    if side <= image_height:
        crop_y0 = min(max(0.0, crop_y0), image_height - side)
    else:
        crop_y0 = 0.0
    return [crop_x0, crop_y0, min(float(image_width), crop_x0 + side), min(float(image_height), crop_y0 + side)]


def normalize_box(box_xyxy: Sequence[float], image_width: int, image_height: int) -> list[float]:
    return [
        round(float(box_xyxy[0]) / image_width, 8),
        round(float(box_xyxy[1]) / image_height, 8),
        round(float(box_xyxy[2]) / image_width, 8),
        round(float(box_xyxy[3]) / image_height, 8),
    ]


def keypoints_to_crop_xyv(
    points_xy: Sequence[Sequence[float]],
    visibility: Sequence[float],
    crop_xyxy: Sequence[float],
) -> list[list[float]]:
    x0, y0, x1, y1 = [float(v) for v in crop_xyxy]
    side_x = max(1e-6, x1 - x0)
    side_y = max(1e-6, y1 - y0)
    out: list[list[float]] = []
    for point, vis in zip(points_xy, visibility):
        x, y = float(point[0]), float(point[1])
        out.append([round((x - x0) / side_x, 8), round((y - y0) / side_y, 8), 1.0 if float(vis) > 0 else 0.0])
    return out


def depth_values_root_relative(
    xyz: Sequence[Sequence[float]] | None,
    visibility: Sequence[float],
) -> list[float | None]:
    if xyz is None:
        return [None for _ in visibility]
    wrist = xyz[0]
    distances = []
    for point, vis in zip(xyz, visibility):
        if float(vis) <= 0:
            continue
        dx = float(point[0]) - float(wrist[0])
        dy = float(point[1]) - float(wrist[1])
        dz = float(point[2]) - float(wrist[2])
        dist = math.sqrt(dx * dx + dy * dy + dz * dz)
        if finite(dist):
            distances.append(dist)
    scale = max(distances) if distances else 1.0
    scale = max(scale, 1e-6)
    return [round((float(point[2]) - float(wrist[2])) / scale, 8) for point in xyz]


def keypoints_xyzv_crop(
    xyv_crop: Sequence[Sequence[float]],
    z_values: Sequence[float | None],
) -> list[list[float | None]]:
    out: list[list[float | None]] = []
    for xyv, z in zip(xyv_crop, z_values):
        out.append([xyv[0], xyv[1], z, xyv[2]])
    return out


def palm_size_norm_from_crop_keypoints(xyv_crop: Sequence[Sequence[float]]) -> float:
    visible = [p for p in xyv_crop if float(p[2]) > 0]
    if not visible:
        return 0.0
    xs = [float(p[0]) for p in visible]
    ys = [float(p[1]) for p in visible]
    return round(max(max(xs) - min(xs), max(ys) - min(ys)), 8)


def hand_record(
    *,
    source_id: str,
    source_split: str,
    split: str,
    record_id: str,
    source_sample_id: str,
    image_archive: Path,
    image_member: str,
    image_width: int,
    image_height: int,
    handedness: str,
    points_xy: Sequence[Sequence[float]],
    visibility: Sequence[float],
    xyz: Sequence[Sequence[float]] | None,
    crop_context: float,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if len(points_xy) != HAND_KEYPOINTS or len(visibility) != HAND_KEYPOINTS:
        raise ValueError(f"{record_id}: expected {HAND_KEYPOINTS} keypoints, got {len(points_xy)}")
    box = box_xyxy_from_points(points_xy, visibility, image_width, image_height)
    if box is None:
        return None
    crop = square_crop_from_box(box, image_width, image_height, crop_context)
    xyv_crop = keypoints_to_crop_xyv(points_xy, visibility, crop)
    z_norm = depth_values_root_relative(xyz, visibility)
    record = {
        "schema_version": SCHEMA_VERSION,
        "record_id": record_id,
        "source_id": source_id,
        "source_split": source_split,
        "split": split,
        "source_sample_id": source_sample_id,
        "license_gate": LICENSE_GATE,
        "image": {
            "path": f"zip://{repo_relative(image_archive)}!/{image_member}",
            "archive_path": repo_relative(image_archive),
            "archive_member": image_member,
            "width": image_width,
            "height": image_height,
        },
        "hand": {
            "presence": 1.0,
            "handedness": handedness,
            "handedness_label": 1.0 if handedness == "right" else 0.0,
            "box_xyxy_norm": normalize_box(box, image_width, image_height),
            "crop_xyxy_norm": normalize_box(crop, image_width, image_height),
            "crop_context": crop_context,
            "keypoints_xyv_crop": xyv_crop,
            "keypoints_xyzv_crop": keypoints_xyzv_crop(xyv_crop, z_norm),
            "palm_size_norm": palm_size_norm_from_crop_keypoints(xyv_crop),
        },
    }
    if extra:
        record["source_metadata"] = extra
    return record


def freihand_split(sample_index: int, validation_stride: int) -> str:
    return "validation" if validation_stride > 0 and sample_index % validation_stride == 0 else "train"


def freihand_records_from_arrays(
    *,
    k_matrices: Sequence[Sequence[Sequence[float]]],
    xyz_samples: Sequence[Sequence[Sequence[float]]],
    image_archive: Path,
    max_unique_samples: int | None = None,
    validation_stride: int = 10,
    crop_context: float = 0.25,
) -> Iterator[dict[str, Any]]:
    image_width, image_height = FREIHAND_IMAGE_SIZE
    limit = min(len(xyz_samples), max_unique_samples if max_unique_samples is not None else len(xyz_samples))
    for sample_index in range(limit):
        xyz = xyz_samples[sample_index]
        uv = project_xyz_to_uv(xyz, k_matrices[sample_index])
        vis = [1.0] * HAND_KEYPOINTS
        split = freihand_split(sample_index, validation_stride)
        for background_index in range(4):
            image_index = sample_index * 4 + background_index
            member = f"training/rgb/{image_index:08d}.jpg"
            record = hand_record(
                source_id="frei_hand",
                source_split="training",
                split=split,
                record_id=f"frei_hand:training:{sample_index:05d}:bg{background_index}",
                source_sample_id=f"training:{sample_index:05d}",
                image_archive=image_archive,
                image_member=member,
                image_width=image_width,
                image_height=image_height,
                handedness="right",
                points_xy=uv,
                visibility=vis,
                xyz=xyz,
                crop_context=crop_context,
                extra={
                    "background_replica_index": background_index,
                    "freihand_handedness_assumption": "right_hand_dataset",
                    "projection": "uv = K * xyz / z",
                },
            )
            if record is not None:
                yield record


def iter_freihand_records(
    freihand_zip: Path,
    max_unique_samples: int | None,
    validation_stride: int,
    crop_context: float,
) -> Iterator[dict[str, Any]]:
    with zipfile.ZipFile(freihand_zip) as zf:
        with zf.open("training_K.json") as f:
            k_matrices = json.load(f)
        with zf.open("training_xyz.json") as f:
            xyz_samples = json.load(f)
    yield from freihand_records_from_arrays(
        k_matrices=k_matrices,
        xyz_samples=xyz_samples,
        image_archive=freihand_zip,
        max_unique_samples=max_unique_samples,
        validation_stride=validation_stride,
        crop_context=crop_context,
    )


def rhd_split(source_split: str) -> str:
    return "train" if source_split == "training" else "validation"


def rhd_records_from_annotations(
    *,
    annotations: dict[Any, Any],
    source_split: str,
    image_archive: Path,
    max_samples: int | None = None,
    crop_context: float = 0.25,
) -> Iterator[dict[str, Any]]:
    image_width, image_height = RHD_IMAGE_SIZE
    keys = sorted(annotations.keys())
    if max_samples is not None:
        keys = keys[:max_samples]
    for sample_key in keys:
        entry = annotations[sample_key]
        uv_vis = entry["uv_vis"].tolist() if hasattr(entry["uv_vis"], "tolist") else entry["uv_vis"]
        xyz = entry["xyz"].tolist() if hasattr(entry["xyz"], "tolist") else entry["xyz"]
        for handedness, start in (("left", 0), ("right", HAND_KEYPOINTS)):
            hand_uvv = uv_vis[start : start + HAND_KEYPOINTS]
            hand_xyz = xyz[start : start + HAND_KEYPOINTS]
            points_xy = [[float(p[0]), float(p[1])] for p in hand_uvv]
            visibility = [1.0 if float(p[2]) > 0 else 0.0 for p in hand_uvv]
            if sum(visibility) < 3:
                continue
            sample_index = int(sample_key)
            member = f"RHD_published_v2/{source_split}/color/{sample_index:05d}.png"
            record = hand_record(
                source_id="rhd",
                source_split=source_split,
                split=rhd_split(source_split),
                record_id=f"rhd:{source_split}:{sample_index:05d}:{handedness}",
                source_sample_id=f"{source_split}:{sample_index:05d}",
                image_archive=image_archive,
                image_member=member,
                image_width=image_width,
                image_height=image_height,
                handedness=handedness,
                points_xy=points_xy,
                visibility=visibility,
                xyz=hand_xyz,
                crop_context=crop_context,
                extra={"rhd_keypoint_range": [start, start + HAND_KEYPOINTS - 1]},
            )
            if record is not None:
                yield record


def load_rhd_pickle_from_zip(rhd_zip: Path, source_split: str) -> dict[Any, Any]:
    member = f"RHD_published_v2/{source_split}/anno_{source_split}.pickle"
    with zipfile.ZipFile(rhd_zip) as zf:
        with zf.open(member) as f:
            return pickle.load(f, encoding="latin1")


def iter_rhd_records(
    rhd_zip: Path,
    source_splits: Sequence[str],
    max_samples_per_split: int | None,
    crop_context: float,
) -> Iterator[dict[str, Any]]:
    for source_split in source_splits:
        annotations = load_rhd_pickle_from_zip(rhd_zip, source_split)
        yield from rhd_records_from_annotations(
            annotations=annotations,
            source_split=source_split,
            image_archive=rhd_zip,
            max_samples=max_samples_per_split,
            crop_context=crop_context,
        )


def validate_record(record: dict[str, Any]) -> None:
    if record.get("schema_version") != SCHEMA_VERSION:
        raise ValueError(f"{record.get('record_id')}: schema mismatch")
    hand = record["hand"]
    xyv = hand["keypoints_xyv_crop"]
    xyzv = hand["keypoints_xyzv_crop"]
    if len(xyv) != HAND_KEYPOINTS or len(xyzv) != HAND_KEYPOINTS:
        raise ValueError(f"{record['record_id']}: bad keypoint count")
    if hand["handedness"] not in {"left", "right"}:
        raise ValueError(f"{record['record_id']}: bad handedness")
    if len(hand["box_xyxy_norm"]) != 4 or len(hand["crop_xyxy_norm"]) != 4:
        raise ValueError(f"{record['record_id']}: bad boxes")


def write_manifest(records: Iterable[dict[str, Any]], manifest_path: Path) -> dict[str, Any]:
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    counts: Counter[str] = Counter()
    split_counts: Counter[str] = Counter()
    source_split_counts: Counter[str] = Counter()
    handedness_counts: Counter[str] = Counter()
    total = 0
    with manifest_path.open("w", encoding="utf-8") as f:
        for record in records:
            validate_record(record)
            f.write(json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n")
            total += 1
            counts[record["source_id"]] += 1
            split_counts[record["split"]] += 1
            source_split_counts[f"{record['source_id']}:{record['source_split']}"] += 1
            handedness_counts[record["hand"]["handedness"]] += 1
    return {
        "records": total,
        "source_counts": dict(sorted(counts.items())),
        "split_counts": dict(sorted(split_counts.items())),
        "source_split_counts": dict(sorted(source_split_counts.items())),
        "handedness_counts": dict(sorted(handedness_counts.items())),
    }


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_records(args: argparse.Namespace) -> Iterator[dict[str, Any]]:
    sources = set(args.sources.split(","))
    if "freihand" in sources:
        yield from iter_freihand_records(
            args.freihand_zip,
            max_unique_samples=args.max_freihand_unique,
            validation_stride=args.freihand_validation_stride,
            crop_context=args.crop_context,
        )
    if "rhd" in sources:
        yield from iter_rhd_records(
            args.rhd_zip,
            source_splits=args.rhd_splits.split(","),
            max_samples_per_split=args.max_rhd_per_split,
            crop_context=args.crop_context,
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--freihand-zip", type=Path, default=Path("data/external/freihand/source/FreiHAND_pub_v2.zip"))
    parser.add_argument("--rhd-zip", type=Path, default=Path("data/external/rhd/source/RHD_v1-1.zip"))
    parser.add_argument("--sources", default="freihand,rhd", help="comma-separated: freihand,rhd")
    parser.add_argument("--rhd-splits", default="training,evaluation")
    parser.add_argument("--out", type=Path, default=Path("data/manifests/m1-hand-public-v1.jsonl"))
    parser.add_argument("--summary-out", type=Path, default=Path("data/receipts/m1-hand-public-manifest-v1.json"))
    parser.add_argument("--max-freihand-unique", type=int, default=None)
    parser.add_argument("--max-rhd-per-split", type=int, default=None)
    parser.add_argument("--freihand-validation-stride", type=int, default=10)
    parser.add_argument("--crop-context", type=float, default=0.25)
    args = parser.parse_args()
    bad_sources = set(args.sources.split(",")) - {"freihand", "rhd"}
    if bad_sources:
        raise SystemExit(f"unsupported sources: {sorted(bad_sources)}")
    for split in args.rhd_splits.split(","):
        if split not in {"training", "evaluation"}:
            raise SystemExit(f"unsupported RHD split: {split}")
    return args


def main() -> None:
    args = parse_args()
    summary = write_manifest(build_records(args), args.out)
    summary.update(
        {
            "schema_version": SCHEMA_VERSION,
            "manifest_path": repo_relative(args.out),
            "manifest_sha256": sha256_file(args.out),
            "command": ["scripts/build_m1_hand_public_manifest.py", *sys.argv[1:]],
            "sources": args.sources.split(","),
            "freihand_zip": repo_relative(args.freihand_zip),
            "rhd_zip": repo_relative(args.rhd_zip),
            "max_freihand_unique": args.max_freihand_unique,
            "max_rhd_per_split": args.max_rhd_per_split,
            "crop_context": args.crop_context,
            "notes": [
                "No dataset download was performed.",
                "COCO-WholeBody hands are intentionally not included in this M1 slice.",
                "FreiHAND training samples are expanded across the four provided RGB background replicas.",
                "RHD emits one record per visible annotated hand.",
            ],
        }
    )
    args.summary_out.parent.mkdir(parents=True, exist_ok=True)
    args.summary_out.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
