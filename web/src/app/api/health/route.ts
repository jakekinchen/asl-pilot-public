import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "asl-pilot-web",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
