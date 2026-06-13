import type { Metadata } from "next";
import { SignPracticeApp } from "@/components/SignPracticeApp";

export const metadata: Metadata = {
  title: "ASL Pilot — Sign Practice",
  description:
    "Sign a target word to your camera; in-browser hand tracking + a from-scratch recognizer grade your attempt. No video leaves your device.",
};

export default function PracticePage() {
  return <SignPracticeApp />;
}
