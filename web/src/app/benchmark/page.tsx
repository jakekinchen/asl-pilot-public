import type { Metadata } from "next";
import { BenchmarkApp } from "@/components/BenchmarkApp";

export const metadata: Metadata = {
  title: "ASL Pilot — Tracking Benchmark",
  description: "In-browser capture-and-replay profiling of the tracking pipeline.",
};

export default function BenchmarkPage() {
  return <BenchmarkApp />;
}
