import type { Metadata } from "next";
import { TrackingPreviewApp } from "@/components/TrackingPreviewApp";

export const metadata: Metadata = {
  title: "ASL Pilot — Live Tracking Preview",
  description: "In-browser from-scratch hand/region tracking preview.",
};

export default function TrackingPage() {
  return <TrackingPreviewApp />;
}
