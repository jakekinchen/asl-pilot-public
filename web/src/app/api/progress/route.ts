import { NextRequest, NextResponse } from "next/server";
import { getProgressForCurrentUser } from "@/lib/server-store";
import { isSupabaseAuthEnabled } from "@/lib/supabase-server";
import { getSupabaseProgress } from "@/lib/supabase-store";

export async function GET(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      return await getSupabaseProgress(request);
    }

    return NextResponse.json(await getProgressForCurrentUser());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load progress." },
      { status: 401 },
    );
  }
}
