export type RoiCropStatus =
  | "approved_for_next_extraction"
  | "needs_manual_roi"
  | "needs_keypoints"
  | "reject_crop";

export type LabelVisibilityStatus = "visible" | "ambiguous" | "not_visible";

export type RoiReviewPacketStatus =
  | "reviewed_roi_keypoint_packet_ready_for_manifest_export"
  | "reviewed_roi_keypoint_packet_rejected";

export type RoiReviewDecision = {
  roi_crop_status: RoiCropStatus;
  label_visibility_status: LabelVisibilityStatus;
  recommended_next_step: string;
  notes: string;
};

export type RoiReviewReviewer = {
  name: string;
  role: string;
  qualification: string;
  affiliation_or_context: string;
  contact_or_signed_evidence: string;
  reviewed_at: string;
};

export type RoiReviewIntake = {
  schema_version: "asl-pilot-asl-citizen-primarymath-roi-review-intake/v1";
  status: RoiReviewPacketStatus;
  reviewer: RoiReviewReviewer;
  decisions: Record<string, RoiReviewDecision>;
};

export type RoiReviewLabelSummary = {
  label_id: string;
  review_priority: string;
  sampled_clip_count: number;
  low_recall_evidence: {
    source: string;
    recall: number;
    support: number;
  }[];
  contact_sheet: {
    path: string;
    sha256: string;
    url: string;
  };
};

export type RoiReviewData = {
  schema_version: "asl-pilot-asl-citizen-primarymath-roi-review-webapp/v1";
  packet_status: string;
  label_count: number;
  sampled_clip_count: number;
  labels: RoiReviewLabelSummary[];
  allowed: {
    roi_crop_statuses: RoiCropStatus[];
    label_visibility_statuses: LabelVisibilityStatus[];
    packet_statuses: RoiReviewPacketStatus[];
  };
  current_gate: {
    review_status: string;
    reviewed_manifest_status: string;
    handoff_package_status: string;
    archive_path: string;
    archive_sha256: string;
  };
};
