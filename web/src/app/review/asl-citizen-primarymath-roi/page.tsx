import type { Metadata } from "next";
import { RoiReviewApp } from "@/components/RoiReviewApp";

export const metadata: Metadata = {
  title: "ROI Review | ASL Pilot",
  description: "Local ASL Citizen PrimaryMath ROI/keypoint review.",
};

export default function RoiReviewPage() {
  return <RoiReviewApp />;
}
