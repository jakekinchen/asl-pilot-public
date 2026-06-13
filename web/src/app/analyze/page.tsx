import type { Metadata } from "next";
import { VideoAnalyzeApp } from "@/components/VideoAnalyzeApp";

export const metadata: Metadata = {
  title: "ASL Pilot — Video Analysis",
  description:
    "Feed a signing video clip through the in-browser hand tracker + from-scratch recognizer and read out the predicted sign. Frames are decoded and analyzed on-device; nothing is uploaded.",
};

export default function AnalyzePage() {
  return <VideoAnalyzeApp />;
}
