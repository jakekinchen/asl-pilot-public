from __future__ import annotations

import unittest
from pathlib import Path

from scripts.build_m1_hand_public_manifest import (
    HAND_KEYPOINTS,
    freihand_records_from_arrays,
    project_xyz_to_uv,
    rhd_records_from_annotations,
    validate_record,
)


def diagonal_xyz(count: int = HAND_KEYPOINTS) -> list[list[float]]:
    return [[0.01 * i, 0.02 * i, 1.0 + 0.01 * i] for i in range(count)]


class M1HandPublicManifestTests(unittest.TestCase):
    def test_projects_xyz_through_intrinsics(self) -> None:
        uv = project_xyz_to_uv(
            [[1.0, 2.0, 1.0], [2.0, 4.0, 2.0]],
            [[10.0, 0.0, 100.0], [0.0, 20.0, 200.0], [0.0, 0.0, 1.0]],
        )
        self.assertEqual(uv, [[110.0, 240.0], [110.0, 240.0]])

    def test_freihand_records_expand_four_backgrounds(self) -> None:
        records = list(
            freihand_records_from_arrays(
                k_matrices=[[[100.0, 0.0, 112.0], [0.0, 100.0, 112.0], [0.0, 0.0, 1.0]]],
                xyz_samples=[diagonal_xyz()],
                image_archive=Path("data/external/freihand/source/FreiHAND_pub_v2.zip"),
                max_unique_samples=1,
                validation_stride=10,
            )
        )
        self.assertEqual(len(records), 4)
        self.assertEqual({r["image"]["archive_member"] for r in records}, {f"training/rgb/{i:08d}.jpg" for i in range(4)})
        for record in records:
            validate_record(record)
            self.assertEqual(record["source_id"], "frei_hand")
            self.assertEqual(record["hand"]["handedness"], "right")
            self.assertEqual(len(record["hand"]["keypoints_xyv_crop"]), HAND_KEYPOINTS)

    def test_rhd_records_emit_visible_left_and_right_hands(self) -> None:
        left = [[20.0 + i, 30.0 + i, 1.0] for i in range(HAND_KEYPOINTS)]
        right = [[120.0 + i, 130.0 + i, 1.0] for i in range(HAND_KEYPOINTS)]
        annotations = {
            0: {
                "uv_vis": left + right,
                "xyz": diagonal_xyz(HAND_KEYPOINTS * 2),
                "K": [[1.0, 0.0, 160.0], [0.0, 1.0, 160.0], [0.0, 0.0, 1.0]],
            }
        }
        records = list(
            rhd_records_from_annotations(
                annotations=annotations,
                source_split="training",
                image_archive=Path("data/external/rhd/source/RHD_v1-1.zip"),
            )
        )
        self.assertEqual([r["hand"]["handedness"] for r in records], ["left", "right"])
        for record in records:
            validate_record(record)
            self.assertEqual(record["source_id"], "rhd")
            self.assertEqual(record["split"], "train")
            self.assertEqual(len(record["hand"]["keypoints_xyzv_crop"]), HAND_KEYPOINTS)


if __name__ == "__main__":
    unittest.main()
