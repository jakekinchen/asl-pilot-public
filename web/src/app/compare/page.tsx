import type { Metadata } from "next";
import { AbCompareApp } from "@/components/AbCompareApp";

export const metadata: Metadata = {
  title: "ASL Pilot — fp16 vs int8 compare",
  description:
    "Run one signing video through both RTMPose recognizer variants (fp16/WebGPU and int8/wasm) at once and compare predictions and extraction time side by side.",
};

export default function ComparePage() {
  return <AbCompareApp />;
}
