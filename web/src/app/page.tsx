import type { Metadata } from "next";
import { LandingHome } from "@/components/LandingHome";

export const metadata: Metadata = {
  title: "ASL Pilot — from-scratch sign recognition, in your browser",
  description:
    "A browser-first American Sign Language recognizer built entirely from scratch — hand detection, landmarks, and sign recognition, all on-device with no pretrained models. Analyze a video, practice with your webcam, or watch the tracker live.",
};

export default function Home() {
  return <LandingHome />;
}
