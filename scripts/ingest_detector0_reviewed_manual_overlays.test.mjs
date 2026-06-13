import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  buildReviewedManualOverlayIngestion,
} from "./ingest_detector0_reviewed_manual_overlays.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("builds a supplemental ingestion artifact from reviewed manual overlays", () => {
  const result = buildReviewedManualOverlayIngestion({
    root,
    checkedAt: "2026-05-30T02:30:00.000Z",
    currentCommit: "test-commit",
  });

  assert.equal(
    result.artifact.schema_version,
    "asl-pilot-detector0-reviewed-manual-overlay-ingestion/v1",
  );
  assert.equal(result.artifact.status, "reviewed_manual_overlay_ingested_not_training_ready");
  assert.equal(result.artifact.rows.length, 17);
  assert.equal(result.artifact.blocked_rows.length, 1);
  assert.equal(result.artifact.validation_summary.promoted_row_count, 17);
  assert.equal(result.artifact.validation_summary.blocked_row_count, 1);
  assert.equal(result.artifact.validation_summary.rejected_row_count, 0);
  assert.deepEqual(result.artifact.validation_summary.promoted_targets, {
    left_or_first_hand: 17,
    right_or_second_hand: 17,
  });
  assert.equal(result.artifact.claim_surface_proof.claim_surfaces_mutated, false);
  assert.equal(result.artifact.readiness_classification.detector0_training_ready, false);
  assert.equal(result.artifact.readiness_classification.browser_promotion_ready, false);

  for (const row of result.artifact.rows) {
    assert.equal(row.review.review_status, "manual_contact_sheet_overlay_authored");
    for (const targetId of ["left_or_first_hand", "right_or_second_hand"]) {
      const target = row.targets[targetId];
      assert.equal(target.presence, true);
      assert.equal(target.coordinate_space, "normalized_full_frame_top_left_xyxy");
      assert.equal(target.box_xyxy_norm.length, 4);
      assert.ok(target.box_xyxy_norm[0] < target.box_xyxy_norm[2]);
      assert.ok(target.box_xyxy_norm[1] < target.box_xyxy_norm[3]);
    }
  }
});
