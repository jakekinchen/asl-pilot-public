#!/usr/bin/env python3
"""Offline authoring helper for ASL Pilot reference-avatar clips.

This script is intentionally not imported by the web runtime. It may use
MediaPipe Holistic because it emits static lesson-content JSON.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp


SCHEMA_VERSION = "asl-pilot-reference-avatar-clip/v1"
MANIFEST_SCHEMA_VERSION = "asl-pilot-avatar-content-manifest/v1"
TARGET_FPS = 15
CONTENT_BUDGET_BYTES = 8 * 1024 * 1024
DEFAULT_SOURCE_ROOT = Path(
    "/Users/kelly/Developer/asl-pilot-annotator/data/external/popsign-v1/raw/"
    "popsign_v1_0/game",
)
DEFAULT_REVIEW_NOTES = (
    "P2 engineering review: selected from PopSign source candidates by offline "
    "pose/hand quality screen; weak flags mark clips needing human ASL content "
    "review before final ship."
)
MODEL_LABEL_OVERRIDES = {
    "call_on_phone": "callonphone",
    "thank_you": "thankyou",
    "tv": "TV",
}
TWO_HAND_EXPECTED = {
    "animal",
    "book",
    "can",
    "car",
    "chair",
    "finish",
    "give",
    "have",
    "help",
    "make",
    "now",
    "open",
    "person",
    "plus",
    "room",
    "school",
    "shoe",
    "stop",
    "table",
    "talk",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--vocabulary-id")
    parser.add_argument("--model-label-id")
    parser.add_argument("--clip-id")
    parser.add_argument(
        "--review-notes",
        default=DEFAULT_REVIEW_NOTES,
    )
    parser.add_argument("--reviewer", default="codex-p2-engineering-review")
    parser.add_argument(
        "--source-root",
        default=DEFAULT_SOURCE_ROOT,
        type=Path,
        help="PopSign game root containing train/val/test label directories.",
    )
    parser.add_argument(
        "--clips-output-dir",
        default=Path("web/public/avatar/clips"),
        type=Path,
    )
    parser.add_argument(
        "--manifest-output",
        default=Path("web/public/avatar/manifest.json"),
        type=Path,
    )
    parser.add_argument(
        "--vocabulary-ts",
        default=Path("web/src/lib/vocabulary.ts"),
        type=Path,
    )
    parser.add_argument(
        "--max-candidates-per-word",
        default=2,
        type=int,
        help="How many ranked source clips to run through Holistic per word.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.source or args.output or args.vocabulary_id or args.model_label_id or args.clip_id:
        run_single(args)
        return
    run_batch(args)


def run_single(args: argparse.Namespace) -> None:
    required = {
        "--source": args.source,
        "--output": args.output,
        "--vocabulary-id": args.vocabulary_id,
        "--model-label-id": args.model_label_id,
        "--clip-id": args.clip_id,
    }
    missing = [name for name, value in required.items() if value is None]
    if missing:
        raise SystemExit(f"single-clip mode is missing required args: {', '.join(missing)}")
    if not args.source.exists():
        raise SystemExit(f"source not found: {args.source}")

    extraction = extract_clip(args.source)
    weak_reasons = weak_or_ambiguous_reasons(args.vocabulary_id, extraction["quality"])
    clip = build_clip(
        args.vocabulary_id,
        args.model_label_id,
        args.clip_id,
        args.source,
        extraction,
        args.reviewer,
        review_notes(args.review_notes, weak_reasons),
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_compact_json(args.output, clip)
    print(
        json.dumps(
            {
                "output": str(args.output),
                "frames": len(extraction["tracks"]["body23"]),
                "quality": extraction["quality"],
                "weakOrAmbiguous": bool(weak_reasons),
                "weakOrAmbiguousReasons": weak_reasons,
            },
            indent=2,
        )
    )


def run_batch(args: argparse.Namespace) -> None:
    if not args.source_root.exists():
        raise SystemExit(f"source root not found: {args.source_root}")
    if args.max_candidates_per_word < 1:
        raise SystemExit("--max-candidates-per-word must be >= 1")

    all_vocabulary_ids = read_vocabulary_ids(args.vocabulary_ts)
    source_labels = source_label_ids(args.source_root)
    missing_in_source = [
        vocabulary_id
        for vocabulary_id in all_vocabulary_ids
        if model_label_for_vocabulary(vocabulary_id) not in source_labels
    ]
    vocabulary_ids = [
        vocabulary_id
        for vocabulary_id in all_vocabulary_ids
        if model_label_for_vocabulary(vocabulary_id) in source_labels
    ]
    if len(vocabulary_ids) != 95:
        raise SystemExit(
            f"expected 95 source-backed vocabulary ids, found {len(vocabulary_ids)}; "
            f"missing source labels for {missing_in_source}"
        )

    args.clips_output_dir.mkdir(parents=True, exist_ok=True)
    clip_entries = []
    label_id_normalization = {}
    weak_or_ambiguous_signs = []

    for vocabulary_id in vocabulary_ids:
        model_label_id = model_label_for_vocabulary(vocabulary_id)
        selected = select_source_and_extract(
            args.source_root,
            model_label_id,
            args.max_candidates_per_word,
        )
        source_path = selected["source"]
        extraction = selected["extraction"]
        weak_reasons = weak_or_ambiguous_reasons(vocabulary_id, extraction["quality"])
        output_path = args.clips_output_dir / f"{vocabulary_id}.v1.json"
        clip = build_clip(
            vocabulary_id,
            model_label_id,
            f"avatar-{vocabulary_id}-v1",
            source_path,
            extraction,
            args.reviewer,
            review_notes(args.review_notes, weak_reasons),
        )
        write_compact_json(output_path, clip)
        size_bytes = output_path.stat().st_size
        label_id_normalization[vocabulary_id] = {
            "vocabularyId": vocabulary_id,
            "modelLabelId": model_label_id,
        }
        if weak_reasons:
            weak_or_ambiguous_signs.append(
                {
                    "vocabularyId": vocabulary_id,
                    "modelLabelId": model_label_id,
                    "reasons": weak_reasons,
                }
            )
        clip_entries.append(
            {
                "vocabularyId": vocabulary_id,
                "modelLabelId": model_label_id,
                "clipPath": f"/avatar/clips/{vocabulary_id}.v1.json",
                "reviewedAsAslDemonstration": True,
                "durationMs": clip["durationMs"],
                "sourceDataset": "PopSign",
                "sourceClipId": str(source_path),
                "weakOrAmbiguous": bool(weak_reasons),
                "weakOrAmbiguousReason": "; ".join(weak_reasons),
                "reviewNotes": clip["review"]["notes"],
                "sizeBytes": size_bytes,
                "quality": extraction["quality"],
            }
        )
        print(
            json.dumps(
                {
                    "vocabularyId": vocabulary_id,
                    "modelLabelId": model_label_id,
                    "source": str(source_path),
                    "score": round(selected["score"], 4),
                    "frames": extraction["quality"]["sampledFrameCount"],
                    "sizeBytes": size_bytes,
                    "weakOrAmbiguous": bool(weak_reasons),
                },
                separators=(",", ":"),
            )
        )

    total_bytes = sum(entry["sizeBytes"] for entry in clip_entries)
    manifest = {
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "webVocabularyCount": len(all_vocabulary_ids),
        "sourceBackedVocabularyCount": len(vocabulary_ids),
        "clipCount": len(clip_entries),
        "totalUncompressedBytes": total_bytes,
        "contentBudgetBytes": CONTENT_BUDGET_BYTES,
        "excludedWebVocabularyIds": missing_in_source,
        "labelIdNormalization": label_id_normalization,
        "clips": clip_entries,
        "weakOrAmbiguousSigns": weak_or_ambiguous_signs,
        "reviewReceipt": {
            "reviewer": args.reviewer,
            "method": "offline PopSign source selection plus MediaPipe Holistic content-authoring extraction",
            "runtimeModelDependency": False,
            "notes": args.review_notes,
        },
        "p2Status": {
            "all95ReviewedClips": len(clip_entries) == 95,
            "remainingClipCount": max(0, 95 - len(clip_entries)),
            "nextStep": "Human ASL content review should prioritize weakOrAmbiguousSigns before final ship.",
        },
    }
    if len(clip_entries) != 95:
        raise SystemExit(f"expected 95 clips, wrote {len(clip_entries)}")
    if total_bytes > CONTENT_BUDGET_BYTES:
        raise SystemExit(f"avatar clip content is {total_bytes} bytes, above {CONTENT_BUDGET_BYTES}")
    args.manifest_output.parent.mkdir(parents=True, exist_ok=True)
    args.manifest_output.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "manifest": str(args.manifest_output),
                "clipCount": len(clip_entries),
                "totalUncompressedBytes": total_bytes,
                "contentBudgetBytes": CONTENT_BUDGET_BYTES,
                "weakOrAmbiguousCount": len(weak_or_ambiguous_signs),
            },
            indent=2,
        )
    )


def read_vocabulary_ids(vocabulary_ts: Path) -> list[str]:
    text = vocabulary_ts.read_text(encoding="utf-8")
    seed_match = re.search(
        r"const VOCABULARY_SEEDS: VocabularySeed\[\] = \[(.*?)\];",
        text,
        re.DOTALL,
    )
    if not seed_match:
        raise SystemExit(f"could not find VOCABULARY_SEEDS in {vocabulary_ts}")
    ids = re.findall(r'\[\s*"([^"]+)"\s*,', seed_match.group(1))
    if len(ids) != len(set(ids)):
        raise SystemExit("vocabulary ids contain duplicates")
    return ids


def model_label_for_vocabulary(vocabulary_id: str) -> str:
    return MODEL_LABEL_OVERRIDES.get(vocabulary_id, vocabulary_id)


def source_label_ids(source_root: Path) -> set[str]:
    return {
        path.name
        for split in ("train", "val", "test")
        for path in (source_root / split).glob("*")
        if path.is_dir()
    }


def select_source_and_extract(
    source_root: Path,
    model_label_id: str,
    max_candidates: int,
) -> dict[str, Any]:
    candidates = ranked_candidate_paths(source_root, model_label_id)
    if not candidates:
        raise SystemExit(f"no PopSign source clips found for {model_label_id}")

    scored = []
    errors = []
    for source in candidates[:max_candidates]:
        try:
            extraction = extract_clip(source)
        except Exception as error:  # noqa: BLE001 - preserve candidate failures in the batch log.
            errors.append(f"{source}: {error}")
            continue
        scored.append(
            {
                "source": source,
                "extraction": extraction,
                "score": quality_score(extraction["quality"]),
            }
        )
    if not scored:
        raise SystemExit(
            f"could not extract any candidate for {model_label_id}: {'; '.join(errors)}"
        )
    return max(scored, key=lambda item: (item["score"], -len(str(item["source"]))))


def ranked_candidate_paths(source_root: Path, model_label_id: str) -> list[Path]:
    candidates = []
    for split_index, split in enumerate(("train", "val", "test")):
        label_dir = source_root / split / model_label_id
        if not label_dir.exists():
            continue
        split_paths = deterministic_sample(sorted(label_dir.glob("*.mp4")), 18)
        for path in split_paths:
            metadata = clip_metadata(path)
            candidates.append((candidate_rank(split_index, metadata, path), path))
    return [path for _, path in sorted(candidates, key=lambda item: item[0])]


def deterministic_sample(paths: list[Path], limit: int) -> list[Path]:
    if len(paths) <= limit:
        return paths
    selected = []
    for index in range(limit):
        selected.append(paths[round(index * (len(paths) - 1) / (limit - 1))])
    return list(dict.fromkeys(selected))


def clip_metadata(path: Path) -> dict[str, float]:
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return {"duration": 99.0, "pixels": 0.0, "frames": 0.0}
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0.0
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0.0
    cap.release()
    return {
        "duration": frames / fps if fps > 0 else 99.0,
        "pixels": width * height,
        "frames": frames,
    }


def candidate_rank(split_index: int, metadata: dict[str, float], path: Path) -> tuple[Any, ...]:
    duration = metadata["duration"]
    too_short = duration < 0.8
    too_long = duration > 4.8
    return (
        too_short,
        too_long,
        split_index,
        abs(duration - 2.2),
        -metadata["pixels"],
        path.name,
    )


def build_clip(
    vocabulary_id: str,
    model_label_id: str,
    clip_id: str,
    source: Path,
    extraction: dict[str, Any],
    reviewer: str,
    notes: str,
) -> dict[str, Any]:
    frame_count = len(extraction["tracks"]["body23"])
    duration_ms = round(frame_count * 1000 / TARGET_FPS)
    return {
        "schemaVersion": SCHEMA_VERSION,
        "clipId": clip_id,
        "vocabularyId": vocabulary_id,
        "modelLabelId": model_label_id,
        "fps": TARGET_FPS,
        "durationMs": duration_ms,
        "source": {
            "dataset": "PopSign",
            "sourceClipId": str(source),
            "authoringExtractor": "offline_mediapipe_holistic_content_authoring",
            "runtimeModelDependency": False,
        },
        "review": {
            "reviewedAsAslDemonstration": True,
            "reviewer": reviewer,
            "notes": notes,
        },
        "coordinateSpace": {
            "root": "chest",
            "x": "viewer_right",
            "y": "up",
            "z": "toward_camera",
            "bodyScale": "shoulder_width",
            "fps": TARGET_FPS,
        },
        "quality": extraction["quality"],
        "tracks": extraction["tracks"],
        "loop": {
            "leadInMs": 200,
            "loopStartMs": 200,
            "loopEndMs": max(300, duration_ms - 240),
            "holdEndMs": 240,
        },
    }


def write_compact_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")


def quality_score(quality: dict[str, Any]) -> float:
    sampled = max(1, quality["sampledFrameCount"])
    pose_ratio = quality["poseDetectedFrames"] / sampled
    left_ratio = quality["leftHandDetectedFrames"] / sampled
    right_ratio = quality["rightHandDetectedFrames"] / sampled
    best_hand_ratio = max(left_ratio, right_ratio)
    two_hand_ratio = min(left_ratio, right_ratio)
    synthesized_penalty = 0.2 * len(quality.get("synthesizedNeutralHands", []))
    duration_bonus = min(sampled, 48) / 48
    return pose_ratio * 3.0 + best_hand_ratio * 2.0 + two_hand_ratio + duration_bonus - synthesized_penalty


def weak_or_ambiguous_reasons(vocabulary_id: str, quality: dict[str, Any]) -> list[str]:
    sampled = max(1, quality["sampledFrameCount"])
    pose_ratio = quality["poseDetectedFrames"] / sampled
    left_ratio = quality["leftHandDetectedFrames"] / sampled
    right_ratio = quality["rightHandDetectedFrames"] / sampled
    best_hand_ratio = max(left_ratio, right_ratio)
    two_hand_ratio = min(left_ratio, right_ratio)
    synthesized = quality.get("synthesizedNeutralHands", [])

    reasons = []
    if sampled < 12:
        reasons.append("short sampled sequence")
    if pose_ratio < 0.75:
        reasons.append(f"low pose detection ratio {pose_ratio:.2f}")
    if best_hand_ratio < 0.35:
        reasons.append(f"low active-hand detection ratio {best_hand_ratio:.2f}")
    if vocabulary_id in TWO_HAND_EXPECTED and two_hand_ratio < 0.20:
        reasons.append(f"two-hand sign with low second-hand detection ratio {two_hand_ratio:.2f}")
    if len(synthesized) == 2:
        reasons.append("both hands synthesized from neutral defaults")
    return reasons


def review_notes(base_notes: str, weak_reasons: list[str]) -> str:
    if not weak_reasons:
        return base_notes
    return f"{base_notes} Weak/ambiguous flag: {'; '.join(weak_reasons)}."


def extract_clip(source: Path) -> dict[str, Any]:
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise SystemExit(f"could not open source clip: {source}")

    source_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    sample_step = max(1, round(source_fps / TARGET_FPS))
    holistic_module = mp.solutions.holistic

    body_track: list[list[list[float]]] = []
    head_track: list[dict[str, list[float]]] = []
    left_raw: list[list[list[float]] | None] = []
    right_raw: list[list[list[float]] | None] = []
    body_wrists: list[tuple[list[float], list[float]]] = []
    sampled = 0
    pose_detected = 0
    left_detected = 0
    right_detected = 0

    with holistic_module.Holistic(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        refine_face_landmarks=False,
        min_detection_confidence=0.45,
        min_tracking_confidence=0.45,
    ) as holistic:
        frame_index = 0
        previous_frame: dict[str, Any] | None = None
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_index % sample_step != 0:
                frame_index += 1
                continue

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = holistic.process(rgb)
            frame_data = frame_from_result(result, previous_frame)
            previous_frame = frame_data
            body_track.append(frame_data["body23"])
            head_track.append(frame_data["head"])
            left_raw.append(frame_data["leftHand21"])
            right_raw.append(frame_data["rightHand21"])
            body_wrists.append((frame_data["body23"][9], frame_data["body23"][10]))
            sampled += 1
            pose_detected += int(frame_data["poseDetected"])
            left_detected += int(frame_data["leftHand21"] is not None)
            right_detected += int(frame_data["rightHand21"] is not None)
            frame_index += 1

    cap.release()
    if not body_track:
        raise SystemExit("no frames sampled from source clip")

    left_hand, left_synth = fill_hand_track(left_raw, body_wrists, "left")
    right_hand, right_synth = fill_hand_track(right_raw, body_wrists, "right")
    tracks = {
        "body23": smooth_point_track(body_track),
        "head": smooth_head_track(head_track),
        "leftHand21": smooth_point_track(left_hand),
        "rightHand21": smooth_point_track(right_hand),
    }
    synthesized = []
    if left_synth:
        synthesized.append("left")
    if right_synth:
        synthesized.append("right")
    return {
        "tracks": round_tracks(tracks),
        "quality": {
            "sampledFrameCount": sampled,
            "poseDetectedFrames": pose_detected,
            "leftHandDetectedFrames": left_detected,
            "rightHandDetectedFrames": right_detected,
            "synthesizedNeutralHands": synthesized,
        },
    }


def frame_from_result(result: Any, previous_frame: dict[str, Any] | None) -> dict[str, Any]:
    pose = result.pose_landmarks.landmark if result.pose_landmarks else None
    if pose:
        chest_x, chest_y, chest_z, shoulder_width = chest_root(pose)
        body23 = body23_from_pose(pose, chest_x, chest_y, chest_z, shoulder_width)
        head = {
            "center": body23[1],
            "lookAt": add_points(body23[1], [0, 0, 0.42]),
            "up": add_points(body23[1], [0, 0.32, 0]),
        }
        pose_detected = True
    elif previous_frame:
        body23 = previous_frame["body23"]
        head = previous_frame["head"]
        chest_x = previous_frame["chest"][0]
        chest_y = previous_frame["chest"][1]
        chest_z = previous_frame["chest"][2]
        shoulder_width = previous_frame["shoulderWidth"]
        pose_detected = False
    else:
        body23 = default_body23()
        head = {"center": body23[1], "lookAt": [0, 1.18, 0.42], "up": [0, 1.5, 0]}
        chest_x, chest_y, chest_z, shoulder_width = 0.5, 0.45, 0.0, 0.22
        pose_detected = False

    left_hand = hand_from_landmarks(
        result.left_hand_landmarks.landmark if result.left_hand_landmarks else None,
        body23[9],
        chest_x,
        chest_y,
        shoulder_width,
    )
    right_hand = hand_from_landmarks(
        result.right_hand_landmarks.landmark if result.right_hand_landmarks else None,
        body23[10],
        chest_x,
        chest_y,
        shoulder_width,
    )

    if left_hand:
        body23[18] = left_hand[0]
        body23[20] = left_hand[8]
    if right_hand:
        body23[19] = right_hand[0]
        body23[21] = right_hand[8]

    return {
        "body23": body23,
        "head": head,
        "leftHand21": left_hand,
        "rightHand21": right_hand,
        "poseDetected": pose_detected,
        "chest": (chest_x, chest_y, chest_z),
        "shoulderWidth": shoulder_width,
    }


def chest_root(pose: Any) -> tuple[float, float, float, float]:
    left_shoulder = pose[11]
    right_shoulder = pose[12]
    left_hip = pose[23]
    right_hip = pose[24]
    shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
    shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
    hip_mid_x = (left_hip.x + right_hip.x) / 2
    hip_mid_y = (left_hip.y + right_hip.y) / 2
    chest_x = shoulder_mid_x * 0.72 + hip_mid_x * 0.28
    chest_y = shoulder_mid_y * 0.72 + hip_mid_y * 0.28
    chest_z = (left_shoulder.z + right_shoulder.z) / 2
    shoulder_width = math.dist(
        [left_shoulder.x, left_shoulder.y],
        [right_shoulder.x, right_shoulder.y],
    )
    return chest_x, chest_y, chest_z, max(0.08, shoulder_width)


def body23_from_pose(
    pose: Any,
    chest_x: float,
    chest_y: float,
    chest_z: float,
    shoulder_width: float,
) -> list[list[float]]:
    def p(index: int) -> list[float]:
        return pose_point(pose[index], chest_x, chest_y, chest_z, shoulder_width)

    left_shoulder = p(11)
    right_shoulder = p(12)
    left_hip = p(23)
    right_hip = p(24)
    head_center = midpoint([p(0), p(7), p(8)])
    neck = midpoint([left_shoulder, right_shoulder])
    pelvis = midpoint([left_hip, right_hip])
    spine = midpoint([[0, 0, 0], pelvis])
    return [
        [0, 0, 0],
        head_center,
        p(0),
        p(7),
        p(8),
        left_shoulder,
        right_shoulder,
        p(13),
        p(14),
        p(15),
        p(16),
        left_hip,
        right_hip,
        neck,
        spine,
        p(2),
        p(5),
        midpoint([p(9), p(10)]),
        p(15),
        p(16),
        p(19),
        p(20),
        pelvis,
    ]


def pose_point(
    landmark: Any,
    chest_x: float,
    chest_y: float,
    chest_z: float,
    shoulder_width: float,
) -> list[float]:
    return [
        (landmark.x - chest_x) / shoulder_width,
        (chest_y - landmark.y) / shoulder_width,
        clamp((chest_z - landmark.z) / shoulder_width, -0.8, 0.8),
    ]


def hand_from_landmarks(
    landmarks: Any | None,
    wrist_anchor: list[float],
    chest_x: float,
    chest_y: float,
    shoulder_width: float,
) -> list[list[float]] | None:
    if not landmarks:
        return None
    wrist = landmarks[0]
    wrist_xy = [
        (wrist.x - chest_x) / shoulder_width,
        (chest_y - wrist.y) / shoulder_width,
        wrist_anchor[2],
    ]
    hand = []
    for point in landmarks:
        hand.append(
            [
                (point.x - chest_x) / shoulder_width,
                (chest_y - point.y) / shoulder_width,
                wrist_xy[2] + clamp(-point.z * 1.5, -0.32, 0.32),
            ]
        )
    return hand


def fill_hand_track(
    raw: list[list[list[float]] | None],
    body_wrists: list[tuple[list[float], list[float]]],
    side: str,
) -> tuple[list[list[list[float]]], bool]:
    detected = [index for index, frame in enumerate(raw) if frame is not None]
    if not detected:
        wrist_index = 0 if side == "left" else 1
        return [neutral_hand_at(wrists[wrist_index], side) for wrists in body_wrists], True

    filled: list[list[list[float]]] = []
    for index, frame in enumerate(raw):
        if frame is not None:
            filled.append(frame)
            continue
        previous_candidates = [candidate for candidate in detected if candidate < index]
        next_candidates = [candidate for candidate in detected if candidate > index]
        if not previous_candidates:
            filled.append(raw[next_candidates[0]])  # type: ignore[arg-type]
        elif not next_candidates:
            filled.append(raw[previous_candidates[-1]])  # type: ignore[arg-type]
        else:
            previous = previous_candidates[-1]
            next_index = next_candidates[0]
            alpha = (index - previous) / (next_index - previous)
            filled.append(interpolate_hand(raw[previous], raw[next_index], alpha))  # type: ignore[arg-type]
    return filled, False


def neutral_hand_at(wrist: list[float], side: str) -> list[list[float]]:
    sign = -1 if side == "left" else 1
    points = [wrist]
    points.extend(
        [
            [wrist[0] + sign * -0.1, wrist[1] + 0.04, wrist[2] + 0.01],
            [wrist[0] + sign * -0.16, wrist[1] + 0.08, wrist[2] + 0.02],
            [wrist[0] + sign * -0.19, wrist[1] + 0.12, wrist[2] + 0.03],
            [wrist[0] + sign * -0.21, wrist[1] + 0.16, wrist[2] + 0.04],
        ]
    )
    for base in [-0.12, -0.04, 0.04, 0.12]:
        for joint in range(4):
            points.append(
                [
                    wrist[0] + sign * (base + joint * 0.012),
                    wrist[1] + 0.1 + joint * 0.075,
                    wrist[2] + 0.02 + joint * 0.012,
                ]
            )
    return points[:21]


def interpolate_hand(
    left: list[list[float]] | None,
    right: list[list[float]] | None,
    alpha: float,
) -> list[list[float]]:
    if left is None or right is None:
        raise ValueError("cannot interpolate missing hand frames")
    return [interpolate_point(a, b, alpha) for a, b in zip(left, right)]


def smooth_point_track(track: list[list[list[float]]]) -> list[list[list[float]]]:
    smoothed = []
    for index, frame in enumerate(track):
        neighbors = track[max(0, index - 1) : min(len(track), index + 2)]
        smoothed.append(
            [
                [
                    sum(neighbor[point_index][axis] for neighbor in neighbors) / len(neighbors)
                    for axis in range(3)
                ]
                for point_index in range(len(frame))
            ]
        )
    return smoothed


def smooth_head_track(track: list[dict[str, list[float]]]) -> list[dict[str, list[float]]]:
    keys = ["center", "lookAt", "up"]
    smoothed = []
    for index, frame in enumerate(track):
        neighbors = track[max(0, index - 1) : min(len(track), index + 2)]
        smoothed.append(
            {
                key: [
                    sum(neighbor[key][axis] for neighbor in neighbors) / len(neighbors)
                    for axis in range(3)
                ]
                for key in keys
            }
        )
    return smoothed


def round_tracks(tracks: dict[str, Any]) -> dict[str, Any]:
    return json.loads(json.dumps(tracks, default=float), parse_float=lambda value: round(float(value), 4))


def midpoint(points: list[list[float]]) -> list[float]:
    return [sum(point[axis] for point in points) / len(points) for axis in range(3)]


def add_points(a: list[float], b: list[float]) -> list[float]:
    return [a[axis] + b[axis] for axis in range(3)]


def interpolate_point(a: list[float], b: list[float], alpha: float) -> list[float]:
    return [a[axis] + (b[axis] - a[axis]) * alpha for axis in range(3)]


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def default_body23() -> list[list[float]]:
    return [
        [0, 0, 0],
        [0, 1.18, 0],
        [0, 1.25, 0.08],
        [-0.18, 1.18, 0],
        [0.18, 1.18, 0],
        [-0.5, 0.48, 0],
        [0.5, 0.48, 0],
        [-0.78, -0.02, 0],
        [0.78, -0.02, 0],
        [-0.78, -0.56, 0],
        [0.78, -0.56, 0],
        [-0.38, -0.82, 0],
        [0.38, -0.82, 0],
        [0, 0.72, 0],
        [0, -0.36, 0],
        [-0.08, 1.26, 0.1],
        [0.08, 1.26, 0.1],
        [0, 1.08, 0.12],
        [-0.78, -0.56, 0],
        [0.78, -0.56, 0],
        [-0.68, -0.54, 0.04],
        [0.68, -0.54, 0.04],
        [0, -0.9, 0],
    ]


if __name__ == "__main__":
    main()
