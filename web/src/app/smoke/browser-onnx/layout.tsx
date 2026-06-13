import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browser ONNX Smoke | ASL Pilot",
  description: "Browser inference wiring smoke test for ASL Pilot.",
};

export default function BrowserOnnxSmokeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
