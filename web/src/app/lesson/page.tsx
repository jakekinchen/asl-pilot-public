import type { Metadata } from "next";
import { LessonApp } from "@/components/LessonApp";

export const metadata: Metadata = {
  title: "ASL Pilot — Lessons",
  description:
    "Browse 100 beginner ASL words by topic — reference signer videos and step-by-step study cards, with an optional local camera framing preview.",
};

export default function LessonPage() {
  return <LessonApp />;
}
